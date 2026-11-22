"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, LoaderCircle, ShoppingCart, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthRouteGuard from "@/components/AuthRouteGuard";
import { getSession } from "@/lib/session";

type WishlistProduct = { id: string; title: string; image: string; category: string; price: number; inStock: boolean };
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");
const CART_API = API_BASE.endsWith("/api/v1") ? API_BASE.replace(/\/api\/v1$/, "/api/v2") : API_BASE;
const object = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null ? value as Record<string, unknown> : {};

function readProducts(payload: unknown): WishlistProduct[] {
  const root = object(payload);
  const data = object(root.data);
  const list = Array.isArray(root.data) ? root.data : Array.isArray(data.data) ? data.data : Array.isArray(data.products) ? data.products : [];
  return list.flatMap((item) => {
    const row = object(item);
    const product = object(row.product ?? row);
    const id = product._id ?? product.id ?? row._id;
    if (typeof id !== "string") return [];
    const category = object(product.category);
    return [{
      id,
      title: typeof product.title === "string" ? product.title : "Product",
      image: typeof product.imageCover === "string" ? product.imageCover : typeof product.image === "string" ? product.image : "",
      category: typeof category.name === "string" ? category.name : "",
      price: typeof product.price === "number" ? product.price : 0,
      inStock: typeof product.quantity !== "number" || product.quantity > 0,
    }];
  });
}

function readCartProductIds(payload: unknown): Set<string> {
  const root = object(payload);
  const data = object(root.data);
  const rows = Array.isArray(data.products) ? data.products : Array.isArray(root.data) ? root.data : [];
  return new Set(rows.flatMap((entry) => {
    const row = object(entry);
    const product = object(row.product ?? row);
    const id = product._id ?? product.id;
    return typeof id === "string" ? [id] : [];
  }));
}

function WishlistContent() {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [cartedProducts, setCartedProducts] = useState<Set<string>>(() => new Set());
  const [confirmProduct, setConfirmProduct] = useState<WishlistProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const loadWishlist = useCallback(async () => {
    const session = getSession();
    if (!session?.token) return;
    setLoading(true);
    try {
      const [wishlistResponse, cartResponse] = await Promise.all([
        fetch(`${API_BASE}/wishlist`, { headers: { token: session.token } }),
        fetch(`${CART_API}/cart`, { headers: { token: session.token, "Cache-Control": "no-cache" }, cache: "no-store" }),
      ]);
      if (!wishlistResponse.ok) throw new Error("Could not load your wishlist");
      const wishlistPayload = await wishlistResponse.json() as unknown;
      setProducts(readProducts(wishlistPayload));
      setCartedProducts(cartResponse.ok ? readCartProductIds(await cartResponse.json() as unknown) : new Set());
    } catch {
      toast.error("Could not load your wishlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadWishlist(); }, [loadWishlist]);

  async function addToCart(productId: string) {
    const session = getSession();
    if (!session?.token) return;
    setBusy(productId);
    try {
      const response = await fetch(`${API_BASE}/cart`, { method: "POST", headers: { "Content-Type": "application/json", token: session.token }, body: JSON.stringify({ productId }) });
      if (!response.ok) throw new Error("Could not add this product to your cart");
      setCartedProducts((current) => new Set(current).add(productId));
      window.dispatchEvent(new Event("freshcart-cart-change"));
      toast.success("Added to cart");
    } catch {
      toast.error("Could not add this product to your cart");
    } finally { setBusy(null); }
  }

  async function removeProduct(productId: string) {
    const session = getSession();
    if (!session?.token) return;
    setBusy(productId);
    try {
      const response = await fetch(`${API_BASE}/wishlist/${encodeURIComponent(productId)}`, { method: "DELETE", headers: { token: session.token } });
      if (!response.ok) throw new Error("Could not remove this product");
      setProducts((current) => current.filter((product) => product.id !== productId));
      setConfirmProduct(null);
      window.dispatchEvent(new Event("freshcart-wishlist-change"));
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Could not remove this product");
    } finally { setBusy(null); }
  }

  return <main className="min-h-screen bg-gray-50/50">
    <header className="border-b border-gray-100 bg-white"><div className="container mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-gray-500"><Link href="/" className="transition-colors hover:text-primary-600">Home</Link><span>/</span><span className="font-medium text-gray-900">Wishlist</span></nav>
      <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500"><Heart size={22} fill="currentColor" aria-hidden="true" /></div><div><h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1><p className="text-sm text-gray-500">{products.length} {products.length === 1 ? "item" : "items"} saved</p></div></div>
    </div></header>
    <div className="container mx-auto px-4 py-8">
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {products.length > 0 && <div className="hidden grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50 px-6 py-4 text-sm font-medium text-gray-500 md:grid"><div className="col-span-6">Product</div><div className="col-span-2 text-center">Price</div><div className="col-span-2 text-center">Status</div><div className="col-span-2 text-center">Actions</div></div>}
        {loading ? <div className="flex items-center justify-center gap-2 p-12 text-gray-500"><LoaderCircle className="animate-spin" size={20} />Loading your wishlist...</div> : products.length ? <div className="divide-y divide-gray-100">{products.map((product) => <article key={product.id} className="grid grid-cols-1 items-center gap-4 p-4 transition-colors hover:bg-gray-50/50 md:grid-cols-12 md:px-6 md:py-5">
          <div className="flex items-center gap-4 md:col-span-6"><Link href={`/products/${product.id}`} aria-label={`View ${product.title}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">{product.image ? <img src={product.image} alt={product.title} className="h-full w-full object-contain p-2" /> : <span className="flex h-full items-center justify-center text-gray-300"><ShoppingCart /></span>}</Link><div className="min-w-0"><Link href={`/products/${product.id}`} className="line-clamp-2 font-medium text-gray-900 transition-colors hover:text-primary-600">{product.title}</Link>{product.category && <p className="mt-1 text-sm text-gray-400">{product.category}</p>}</div></div>
          <div className="flex items-center gap-2 md:col-span-2 md:justify-center"><span className="text-sm text-gray-500 md:hidden">Price:</span><span className="font-semibold text-gray-900">{product.price} EGP</span></div>
          <div className="flex items-center md:col-span-2 md:justify-center"><span className="mr-2 text-sm text-gray-500 md:hidden">Status:</span><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cartedProducts.has(product.id) ? "bg-blue-50 text-blue-700" : product.inStock ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${cartedProducts.has(product.id) ? "bg-blue-500" : product.inStock ? "bg-green-500" : "bg-gray-400"}`} />{cartedProducts.has(product.id) ? "In Cart" : product.inStock ? "In Stock" : "Out of Stock"}</span></div>
          <div className="flex items-center gap-2 md:col-span-2 md:justify-center">{cartedProducts.has(product.id) ? <Link href="/cart" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 md:flex-none"><ShoppingCart size={15} /><span>View Cart</span></Link> : <button type="button" disabled={busy === product.id || !product.inStock} onClick={() => void addToCart(product.id)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 md:flex-none">{busy === product.id ? <LoaderCircle size={15} className="animate-spin" /> : <ShoppingCart size={15} />}<span className="md:hidden lg:inline">Add to Cart</span></button>}<button type="button" disabled={busy === product.id} onClick={() => setConfirmProduct(product)} aria-label={`Remove ${product.title} from wishlist`} title="Remove" className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"><Trash2 size={16} /></button></div>
        </article>)}</div> : <div className="px-6 py-16 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-400"><Heart size={28} aria-hidden="true" /></div><h2 className="text-lg font-semibold text-gray-900">Your wishlist is empty</h2><p className="mt-2 text-sm text-gray-500">Save products you love and find them here later.</p><Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700">Continue Shopping <ArrowRight size={16} /></Link></div>}
      </section>
      {!loading && products.length > 0 && <div className="mt-8"><Link href="/products" className="text-sm font-medium text-gray-500 transition-colors hover:text-primary-600">← Continue Shopping</Link></div>}
    </div>
    {confirmProduct && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && busy !== confirmProduct.id) setConfirmProduct(null); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="wishlist-remove-title" aria-describedby="wishlist-remove-description" className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
        <div className="p-6 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500"><Trash2 size={30} aria-hidden="true" /></div><h2 id="wishlist-remove-title" className="mb-2 text-xl font-bold text-gray-900">Remove Item?</h2><p id="wishlist-remove-description" className="text-sm leading-relaxed text-gray-500">Remove <span className="font-semibold text-gray-700">{confirmProduct.title}</span> from your wishlist?</p></div>
        <div className="flex justify-center gap-3 px-6 pb-6"><button type="button" disabled={busy === confirmProduct.id} onClick={() => setConfirmProduct(null)} className="rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-200 disabled:opacity-60">Cancel</button><button type="button" disabled={busy === confirmProduct.id} onClick={() => void removeProduct(confirmProduct.id)} className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-semibold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70">{busy === confirmProduct.id && <LoaderCircle size={16} className="animate-spin" />}Remove</button></div>
      </section>
    </div>}
  </main>;
}

export default function WishlistPage() {
  return <AuthRouteGuard access="signed-in"><WishlistContent /></AuthRouteGuard>;
}
