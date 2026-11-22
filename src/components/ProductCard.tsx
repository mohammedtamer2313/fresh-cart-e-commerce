"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Eye, Heart, LoaderCircle, Plus, RefreshCw, Star } from "lucide-react";
import toast from "react-hot-toast";
import { getSession } from "@/lib/session";
import type { StoreProduct } from "@/lib/store-api";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");
const CART_API_URL = (process.env.NEXT_PUBLIC_API_V2_URL ?? (API_BASE_URL.endsWith("/api/v1") ? API_BASE_URL.replace(/\/api\/v1$/, "/api/v2") : "https://ecommerce.routemisr.com/api/v2")).replace(/\/$/, "");
let wishlistRequest: { token: string; promise: Promise<Set<string>> } | null = null;
let cartRequest: { token: string; promise: Promise<Set<string>> } | null = null;
let cartRefreshScheduled = false;

function getCartToken(): string | null {
  try {
    const token = window.localStorage.getItem("userToken");
    if (token) return token;
  } catch {
    // Use the session cookie when local storage is unavailable.
  }
  return getSession()?.token ?? null;
}

function getCartIds(token: string): Promise<Set<string>> {
  if (cartRequest?.token === token) return cartRequest.promise;
  const promise = fetch(`${CART_API_URL}/cart`, { headers: { token, "Cache-Control": "no-cache" }, cache: "no-store" })
    .then(async (response) => response.ok ? await response.json() as unknown : null)
    .then((payload) => {
      const root = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
      const data = typeof root.data === "object" && root.data !== null ? root.data as Record<string, unknown> : {};
      const products = Array.isArray(data.products) ? data.products : Array.isArray(root.products) ? root.products : [];
      return new Set(products.flatMap((entry) => {
        const row = typeof entry === "object" && entry !== null ? entry as Record<string, unknown> : {};
        const product = typeof row.product === "object" && row.product !== null ? row.product as Record<string, unknown> : row;
        const id = product._id ?? product.id;
        return typeof id === "string" ? [id] : [];
      }));
    });
  cartRequest = { token, promise };
  return promise;
}

function scheduleCartRefresh(): void {
  if (cartRefreshScheduled) return;
  cartRefreshScheduled = true;
  queueMicrotask(() => {
    cartRequest = null;
    cartRefreshScheduled = false;
    window.dispatchEvent(new Event("freshcart-cart-refresh"));
  });
}

function getWishlistIds(token: string): Promise<Set<string>> {
  if (wishlistRequest?.token === token) return wishlistRequest.promise;
  const promise = fetch(`${API_BASE_URL}/wishlist`, { headers: { token } })
    .then(async (response) => response.ok ? await response.json() as { data?: unknown } : null)
    .then((payload) => {
      const root = payload?.data;
      const data = typeof root === "object" && root !== null && "data" in root ? (root as { data?: unknown }).data : root;
      if (!Array.isArray(data)) return new Set<string>();
      return new Set(data.flatMap((entry) => {
        const row = typeof entry === "object" && entry !== null ? entry as Record<string, unknown> : {};
        const saved = typeof row.product === "object" && row.product !== null ? row.product as Record<string, unknown> : row;
        const id = saved._id ?? saved.id;
        return typeof id === "string" ? [id] : [];
      }));
    });
  wishlistRequest = { token, promise };
  return promise;
}

async function submitProductAction(path: "/cart" | "/wishlist", productId: string): Promise<boolean> {
  const session = getSession();
  if (!session?.token) {
    toast.error("Please sign in to continue");
    return false;
  }

  try {
    const apiBase = path === "/cart" ? CART_API_URL : API_BASE_URL;
    const response = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: session.token },
      body: JSON.stringify({ productId }),
    });
    if (!response.ok) throw new Error("Request failed");
    window.dispatchEvent(new Event(path === "/wishlist" ? "freshcart-wishlist-change" : "freshcart-cart-change"));
    toast.success(path === "/wishlist" ? "Added to wishlist" : "Added to cart");
    return true;
  } catch {
    toast.error("Could not complete that request");
    return false;
  }
}

export default function ProductCard({ product }: { product: StoreProduct }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function syncWishlist() {
      const session = getSession();
      if (!session?.token) { if (active) setIsWishlisted(false); return; }
      try { const ids = await getWishlistIds(session.token); if (active) setIsWishlisted(ids.has(product.id)); }
      catch { /* keep the heart in its default state when wishlist data is unavailable */ }
    }
    void syncWishlist();
    window.addEventListener("freshcart-wishlist-change", syncWishlist);
    return () => { active = false; window.removeEventListener("freshcart-wishlist-change", syncWishlist); };
  }, [product.id]);

  useEffect(() => {
    let active = true;
    async function syncCart() {
      const token = getCartToken();
      if (!token) { if (active) setIsInCart(false); return; }
      try {
        const ids = await getCartIds(token);
        if (active) setIsInCart(ids.has(product.id));
      } catch { /* Keep the current button state if cart data is temporarily unavailable. */ }
    }
    void syncCart();
    const onCartChange = () => scheduleCartRefresh();
    window.addEventListener("freshcart-cart-change", onCartChange);
    window.addEventListener("freshcart-cart-refresh", syncCart);
    return () => {
      active = false;
      window.removeEventListener("freshcart-cart-change", onCartChange);
      window.removeEventListener("freshcart-cart-refresh", syncCart);
    };
  }, [product.id]);

  async function addToCart() {
    if (isInCart || cartBusy) return;
    setCartBusy(true);
    if (await submitProductAction("/cart", product.id)) setIsInCart(true);
    setCartBusy(false);
  }

  async function toggleWishlist() {
    const session = getSession();
    if (!session?.token) { toast.error("Please sign in to continue"); return; }
    setWishlistBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist${isWishlisted ? `/${encodeURIComponent(product.id)}` : ""}`, {
        method: isWishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", token: session.token },
        ...(!isWishlisted ? { body: JSON.stringify({ productId: product.id }) } : {}),
      });
      if (!response.ok) throw new Error("Wishlist update failed");
      setIsWishlisted((current) => !current);
      wishlistRequest = null;
      window.dispatchEvent(new Event("freshcart-wishlist-change"));
      toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch { toast.error("Could not update your wishlist"); }
    finally { setWishlistBusy(false); }
  }

  const discounted = typeof product.priceAfterDiscount === "number" && product.priceAfterDiscount > 0 && product.priceAfterDiscount < product.price;
  const price = discounted ? product.priceAfterDiscount as number : product.price;
  const discount = discounted ? Math.round((1 - price / product.price) * 100) : 0;
  const rating = Math.max(0, Math.min(5, product.rating));

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md" data-product-card="true">
      <div className="group relative">
        <Link href={`/products/${product.id}`} aria-label={`View ${product.title}`}>
          {product.image ? <img src={product.image} alt={product.title} className="h-48 w-full bg-white object-contain sm:h-60" loading="lazy" /> : <div className="h-48 bg-gray-100 sm:h-60" />}
        </Link>
        {discount > 0 && <span className="absolute left-3 top-3 rounded bg-red-500 px-2 py-1 text-xs text-white">-{discount}%</span>}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button type="button" title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"} aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={isWishlisted} disabled={wishlistBusy} onClick={() => void toggleWishlist()} className={`flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs transition disabled:opacity-60 ${isWishlisted ? "text-red-500" : "text-gray-600 hover:text-red-500"}`}><Heart size={17} fill={isWishlisted ? "currentColor" : "none"} /></button>
          <button type="button" title="Compare product" aria-label="Compare product" onClick={() => toast.success("Product added to compare")} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-600 shadow-xs transition hover:text-primary-600"><RefreshCw size={16} /></button>
          <Link href={`/products/${product.id}`} title="View product" aria-label="View product" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-600 shadow-xs transition hover:text-primary-600"><Eye size={17} /></Link>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs text-gray-500">{product.category}</p>
        <h2 className="mb-2 min-h-10 font-medium leading-5 text-gray-800" title={product.title}><Link href={`/products/${product.id}`} className="line-clamp-2 hover:text-primary-600">{product.title}</Link></h2>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex text-amber-400" aria-label={`${rating.toFixed(1)} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < Math.round(rating) ? "currentColor" : "none"} />)}</span>
          <span className="text-xs text-gray-500">{rating.toFixed(1)} ({product.ratingsCount})</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="min-w-0"><span className={`text-lg font-bold ${discounted ? "text-primary-600" : "text-gray-800"}`}>{price} EGP</span>{discounted && <span className="ml-2 text-sm text-gray-500 line-through">{product.price} EGP</span>}</div>
          <button type="button" aria-label={isInCart ? `${product.title} is in your cart` : `Add ${product.title} to cart`} aria-pressed={isInCart} disabled={isInCart || cartBusy} onClick={() => void addToCart()} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition disabled:cursor-default ${isInCart ? "bg-green-600" : "bg-primary-600 hover:bg-primary-700"}`}>{cartBusy ? <LoaderCircle size={18} className="animate-spin" /> : isInCart ? <Check size={20} /> : <Plus size={20} />}</button>
        </div>
      </div>
    </article>
  );
}
