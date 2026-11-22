"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronRight, LoaderCircle, LockKeyhole, Minus, Plus, ShoppingBag, ShoppingCart, ShieldCheck, Tag, Trash2, Truck } from "lucide-react";
import toast from "react-hot-toast";
import AuthRouteGuard from "@/components/AuthRouteGuard";
import PageLoading from "@/components/PageLoading";
import { getSession } from "@/lib/session";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, getShippingFee } from "@/lib/cart-pricing";

type CartItem = { productId: string; title: string; image: string; category: string; sku: string; price: number; count: number; inStock: boolean };
type CartState = { id: string; items: CartItem[]; total: number };
const API_V1 = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");
const CART_API = (process.env.NEXT_PUBLIC_API_V2_URL ?? (API_V1.endsWith("/api/v1") ? API_V1.replace(/\/api\/v1$/, "/api/v2") : "https://ecommerce.routemisr.com/api/v2")).replace(/\/$/, "");
const obj = (v: unknown): Record<string, unknown> => typeof v === "object" && v !== null ? v as Record<string, unknown> : {};
const emptyCart = (): CartState => ({ id: "", items: [], total: 0 });

function readCartToken(): string | null {
  try {
    const token = window.localStorage.getItem("userToken");
    if (token) return token;
  } catch {
    // Fall back to the app's session cookie if storage is unavailable.
  }
  return getSession()?.token ?? null;
}

async function readJson(response: Response): Promise<unknown> {
  try { return await response.json() as unknown; } catch { return null; }
}

function parseCart(payload: unknown): CartState {
  const root = obj(payload);
  const data = obj(root.data);
  const rows = Array.isArray(data.products) ? data.products : Array.isArray(data.items) ? data.items : [];
  const items = rows.flatMap((entry) => {
    const row = obj(entry);
    const product = obj(row.product ?? row.productId ?? row.item ?? row);
    const id = product._id ?? product.id ?? row.productId;
    if (typeof id !== "string") return [];
    const category = obj(product.category);
    const count = typeof row.count === "number" ? row.count : typeof row.quantity === "number" ? row.quantity : 1;
    const discountedPrice = row.priceAfterDiscount ?? product.priceAfterDiscount;
    const regularPrice = row.price ?? product.price;
    const price = typeof discountedPrice === "number" && discountedPrice > 0 ? discountedPrice : typeof regularPrice === "number" ? regularPrice : 0;
    return [{ productId: id, title: typeof product.title === "string" ? product.title : "Product", image: typeof product.imageCover === "string" ? product.imageCover : "", category: typeof category.name === "string" ? category.name : "", sku: id.slice(-6).toUpperCase(), price, count, inStock: typeof product.quantity !== "number" || product.quantity > 0 }];
  });
  const serverTotal = data.totalCartPrice ?? data.totalPrice;
  return { id: typeof data._id === "string" ? data._id : "", items, total: typeof serverTotal === "number" ? serverTotal : items.reduce((sum, item) => sum + item.price * item.count, 0) };
}

function CartExperience() {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>({ id: "", items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmProduct, setConfirmProduct] = useState<CartItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);

  const loadCart = useCallback(async () => {
    const token = readCartToken();
    if (!token) {
      await Promise.resolve();
      setCart(emptyCart());
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${CART_API}/cart`, { headers: { token, "Cache-Control": "no-cache" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (response.status === 404) { setCart(emptyCart()); return; }
      if (response.status === 401) { setCart(emptyCart()); router.replace("/login?next=%2Fcart"); return; }
      if (!response.ok) throw new Error("Could not load your cart");
      setCart(parseCart(await readJson(response)));
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") toast.error("Cart request timed out. Please try again.");
      else toast.error("Could not load your cart");
    }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void Promise.resolve().then(loadCart); }, [loadCart]);
  const itemCount = useMemo(() => cart.items.reduce((total, item) => total + item.count, 0), [cart.items]);
  const subtotal = useMemo(() => cart.items.reduce((total, item) => total + item.price * item.count, 0), [cart.items]);
  const shipping = getShippingFee(subtotal);
  const total = Math.max(0, subtotal - promoDiscount) + shipping;
  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  async function updateCount(productId: string, count: number) {
    const token = readCartToken();
    if (!token || count < 1) return;
    const previousCount = cart.items.find((item) => item.productId === productId)?.count;
    if (previousCount === undefined) return;
    // Update the row and every derived price immediately while the API saves it.
    setCart((current) => ({ ...current, items: current.items.map((item) => item.productId === productId ? { ...item, count } : item) }));
    setBusy(productId);
    try {
      const response = await fetch(`${CART_API}/cart/${encodeURIComponent(productId)}`, { method: "PUT", headers: { "Content-Type": "application/json", token }, body: JSON.stringify({ count }), signal: AbortSignal.timeout(8000) });
      const result = obj(await readJson(response));
      if (response.status === 401) { setCart((current) => ({ ...current, items: current.items.map((item) => item.productId === productId ? { ...item, count: previousCount } : item) })); router.replace("/login?next=%2Fcart"); return; }
      if (response.status === 404) throw new Error("This cart item no longer exists. Refresh the page and try again.");
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Could not update quantity");
      const data = obj(result.data);
      // Prefer the server's canonical cart; fall back to a fresh GET if the update response omits it.
      if (Array.isArray(data.products)) setCart(parseCart(result));
      else {
        const refreshed = await fetch(`${CART_API}/cart`, { headers: { token, "Cache-Control": "no-cache" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
        if (refreshed.status === 404) { setCart(emptyCart()); return; }
        if (refreshed.status === 401) { router.replace("/login?next=%2Fcart"); return; }
        if (!refreshed.ok) throw new Error("Quantity updated, but the cart could not be refreshed");
        setCart(parseCart(await readJson(refreshed)));
      }
      setPromoDiscount(0);
      window.dispatchEvent(new Event("freshcart-cart-change"));
    } catch (error) {
      setCart((current) => ({ ...current, items: current.items.map((item) => item.productId === productId ? { ...item, count: previousCount } : item) }));
      toast.error(error instanceof Error ? error.message : "Could not update quantity");
    }
    finally { setBusy(null); }
  }

  async function removeItem(productId: string) {
    const token = readCartToken();
    if (!token) return;
    setBusy(productId);
    try {
      const response = await fetch(`${CART_API}/cart/${encodeURIComponent(productId)}`, { method: "DELETE", headers: { token }, signal: AbortSignal.timeout(8000) });
      if (response.status === 401) { router.replace("/login?next=%2Fcart"); return; }
      if (response.status === 404) { setCart((current) => ({ ...current, items: current.items.filter((item) => item.productId !== productId) })); setConfirmProduct(null); return; }
      if (!response.ok) throw new Error("Could not remove item");
      setCart((current) => ({ ...current, items: current.items.filter((item) => item.productId !== productId) }));
      setConfirmProduct(null);
      setPromoDiscount(0);
      window.dispatchEvent(new Event("freshcart-cart-change"));
      toast.success("Item removed from cart");
    } catch { toast.error("Could not remove item from cart"); }
    finally { setBusy(null); }
  }

  async function clearCart() {
    const token = readCartToken();
    if (!token || !cart.items.length) return;
    setClearing(true);
    try {
      const response = await fetch(`${CART_API}/cart`, { method: "DELETE", headers: { token }, signal: AbortSignal.timeout(8000) });
      if (response.status === 401) { router.replace("/login?next=%2Fcart"); return; }
      if (response.status === 404) { setCart(emptyCart()); setConfirmClear(false); return; }
      if (!response.ok) throw new Error("Could not clear cart");
      setCart((current) => ({ ...current, items: [], total: 0 }));
      setConfirmClear(false);
      setPromoDiscount(0);
      window.dispatchEvent(new Event("freshcart-cart-change"));
      toast.success("Cart cleared");
    } catch { toast.error("Could not clear cart"); }
    finally { setClearing(false); }
  }

  async function applyPromo() {
    const token = readCartToken();
    if (!token || !promo.trim()) { toast.error("Enter a promo code first"); return; }
    setBusy("promo");
    try {
      const response = await fetch(`${CART_API}/cart/applyCoupon`, { method: "PUT", headers: { "Content-Type": "application/json", token }, body: JSON.stringify({ couponName: promo.trim() }), signal: AbortSignal.timeout(8000) });
      const result = obj(await readJson(response));
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Invalid promo code");
      const data = obj(result.data);
      const returnedCart = obj(data.cart);
      const afterDiscount = typeof data.totalAfterDiscount === "number"
        ? data.totalAfterDiscount
        : typeof returnedCart.totalAfterDiscount === "number"
          ? returnedCart.totalAfterDiscount
          : typeof result.totalAfterDiscount === "number" ? result.totalAfterDiscount : null;
      if (afterDiscount !== null) setPromoDiscount(Math.max(0, subtotal - afterDiscount));
      toast.success("Promo code applied");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not apply promo code"); }
    finally { setBusy(null); }
  }

  if (loading) return <PageLoading />;

  return <div className="min-h-screen bg-gray-50 py-8"><div className="container mx-auto px-4">
    <div className="mb-8"><nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-gray-500"><Link href="/" className="transition hover:text-primary-600">Home</Link><span>/</span><span className="font-medium text-gray-900">Shopping Cart</span></nav><div><h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-primary-600 to-primary-700 text-white"><ShoppingCart size={23} /></span>Shopping Cart</h1><p className="mt-2 text-gray-500">You have <span className="font-semibold text-primary-600">{itemCount} {itemCount === 1 ? "item" : "items"}</span> in your cart</p></div></div>
    {!cart.items.length ? <section className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-xs"><span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600"><ShoppingCart size={29} /></span><h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2><p className="mt-2 text-gray-500">Find something you love and it will show up here.</p><Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700">Continue Shopping <ArrowRight size={16} /></Link></section> : <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2"><div className="space-y-4">{cart.items.map((item) => <article key={item.productId} className="rounded-2xl border border-gray-100 bg-white shadow-xs transition-all duration-300 hover:shadow-md"><div className="p-4 sm:p-5"><div className="flex gap-4 sm:gap-6"><Link href={`/products/${item.productId}`} aria-label={`View ${item.title}`} className="group relative shrink-0"><div className="h-28 w-28 overflow-hidden rounded-xl border border-gray-100 bg-linear-to-br from-gray-50 via-white to-gray-100 p-3 sm:h-32 sm:w-32">{item.image && <img src={item.image} alt={item.title} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110" />}</div><span className={`absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${item.inStock ? "bg-green-500" : "bg-gray-400"}`}><Check size={10} />{item.inStock ? "In Stock" : "Out of Stock"}</span></Link><div className="flex min-w-0 flex-1 flex-col"><div className="mb-3"><Link href={`/products/${item.productId}`} className="text-base font-semibold leading-relaxed text-gray-900 transition-colors hover:text-primary-600 sm:text-lg">{item.title}</Link><div className="mt-2 flex items-center gap-2">{item.category && <span className="rounded-full bg-linear-to-r from-primary-50 to-emerald-50 px-2.5 py-1 text-xs font-medium text-primary-700">{item.category}</span>}<span className="text-xs text-gray-400">•</span><span className="text-xs text-gray-500">SKU: {item.sku}</span></div></div><div className="mb-4"><span className="text-lg font-bold text-primary-600">{item.price} EGP</span><span className="ml-2 text-xs text-gray-400">per unit</span></div><div className="mt-auto flex flex-wrap items-center justify-between gap-4"><div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1"><button type="button" disabled={busy === item.productId || item.count <= 1} onClick={() => void updateCount(item.productId, item.count - 1)} aria-label="Decrease quantity" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 shadow-xs transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"><Minus size={13} /></button><span className="w-12 text-center font-bold text-gray-900">{item.count}</span><button type="button" disabled={busy === item.productId || !item.inStock} onClick={() => void updateCount(item.productId, item.count + 1)} aria-label="Increase quantity" className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-xs shadow-primary-600/30 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={13} /></button></div><div className="flex items-center gap-4"><div className="text-right"><p className="mb-0.5 text-xs text-gray-400">Total</p><p className="text-xl font-bold text-gray-900">{item.price * item.count} <span className="text-sm font-medium text-gray-400">EGP</span></p></div><button type="button" disabled={busy === item.productId} onClick={() => setConfirmProduct(item)} title="Remove item" aria-label={`Remove ${item.title} from cart`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 transition-all duration-200 hover:border-red-500 hover:bg-red-500 hover:text-white disabled:opacity-40"><Trash2 size={16} /></button></div></div></div></div></div></article>)}</div>
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6"><Link href="/products" className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"><span>←</span> Continue Shopping</Link><button type="button" disabled={clearing} onClick={() => setConfirmClear(true)} className="group flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"><Trash2 size={14} className="transition-transform group-hover:scale-110" /><span>Clear all items</span></button></div>
      </div>
      <aside className="lg:col-span-1"><section className="sticky top-24 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs"><div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 py-4"><h2 className="flex items-center gap-2 text-lg font-bold text-white"><ShoppingBag size={18} />Order Summary</h2><p className="mt-1 text-sm text-primary-100">{itemCount} {itemCount === 1 ? "item" : "items"} in your cart</p></div><div className="space-y-5 p-6"><div className={`flex items-center gap-3 rounded-xl p-4 ${shipping === 0 ? "bg-linear-to-r from-green-50 to-emerald-50" : "bg-linear-to-r from-amber-50 to-orange-50"}`}><span className={`flex h-10 w-10 items-center justify-center rounded-full ${shipping === 0 ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}><Truck size={20} /></span><div><p className={`font-semibold ${shipping === 0 ? "text-green-700" : "text-amber-800"}`}>{shipping === 0 ? "Free Shipping Unlocked!" : `Add ${amountToFreeShipping.toLocaleString()} EGP for free delivery`}</p><p className={`text-sm ${shipping === 0 ? "text-green-600" : "text-amber-700"}`}>{shipping === 0 ? "Your order qualifies for free delivery" : `Standard delivery: ${STANDARD_SHIPPING_FEE} EGP`}</p></div></div><div aria-label={`Free delivery progress: ${Math.round(shippingProgress)}%`} className="space-y-2"><div className="flex justify-between text-xs font-medium text-gray-500"><span>{shipping === 0 ? "Free delivery achieved" : "Free delivery progress"}</span><span>{subtotal.toLocaleString()} / {FREE_SHIPPING_THRESHOLD} EGP</span></div><div className="h-2.5 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full transition-all duration-500 ${shipping === 0 ? "bg-green-500" : "bg-linear-to-r from-primary-500 to-emerald-400"}`} style={{ width: `${shippingProgress}%` }} /></div></div><div className="space-y-3"><div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium text-gray-900">{subtotal.toLocaleString()} EGP</span></div>{promoDiscount > 0 && <div className="flex justify-between text-gray-600"><span>Promo discount</span><span className="font-medium text-green-600">−{promoDiscount.toLocaleString()} EGP</span></div>}<div className="flex justify-between text-gray-600"><span>Shipping</span><span className={`font-medium ${shipping === 0 ? "text-green-600" : "text-gray-900"}`}>{shipping === 0 ? "FREE" : `${shipping} EGP`}</span></div><div className="mt-3 border-t border-dashed border-gray-200 pt-3"><div className="flex items-baseline justify-between"><span className="font-semibold text-gray-900">Total</span><span className="text-right text-2xl font-bold text-gray-900">{total.toLocaleString()} <span className="text-sm font-medium text-gray-500">EGP</span></span></div></div></div>
        {!showPromo ? <button type="button" onClick={() => setShowPromo(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-gray-600 transition-all hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-600"><Tag size={16} /><span className="text-sm font-medium">Apply Promo Code</span></button> : <div className="flex gap-2"><input value={promo} onChange={(event) => setPromo(event.target.value)} aria-label="Promo code" placeholder="Enter promo code" className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-hidden focus:border-primary-500" /><button type="button" disabled={busy === "promo"} onClick={() => void applyPromo()} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">{busy === "promo" ? <LoaderCircle size={16} className="animate-spin" /> : "Apply"}</button></div>}
        <Link href="/checkout" className="flex w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-primary-600 to-primary-700 px-6 py-4 font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:from-primary-700 hover:to-primary-800 active:scale-[0.98]"><LockKeyhole size={17} /><span>Secure Checkout</span><ChevronRight size={17} /></Link><div className="flex items-center justify-center gap-4 py-2 text-xs text-gray-500"><span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-500" />Secure Payment</span><span className="h-4 w-px bg-gray-200" /><span className="flex items-center gap-1.5"><Truck size={14} className="text-blue-500" />Fast Delivery</span></div><Link href="/products" className="block py-2 text-center text-sm font-medium text-primary-600 hover:text-primary-700">← Continue Shopping</Link></div></section></aside>
    </div>}
    {confirmProduct && <div className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && busy !== confirmProduct.productId) setConfirmProduct(null); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="cart-remove-title" aria-describedby="cart-remove-description" className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
        <div className="p-6 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500"><Trash2 size={30} aria-hidden="true" /></div><h2 id="cart-remove-title" className="mb-2 text-xl font-bold text-gray-900">Remove Item?</h2><p id="cart-remove-description" className="text-sm leading-relaxed text-gray-500">Remove <span className="font-semibold text-gray-700">{confirmProduct.title}</span> from your cart?</p></div>
        <div className="flex justify-center gap-3 px-6 pb-6"><button type="button" disabled={busy === confirmProduct.productId} onClick={() => setConfirmProduct(null)} className="rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-200 disabled:opacity-60">Cancel</button><button type="button" disabled={busy === confirmProduct.productId} onClick={() => void removeItem(confirmProduct.productId)} className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-semibold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70">{busy === confirmProduct.productId && <LoaderCircle size={16} className="animate-spin" />}Remove</button></div>
      </section>
    </div>}
    {confirmClear && <div className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !clearing) setConfirmClear(false); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="cart-clear-title" aria-describedby="cart-clear-description" className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
        <div className="p-6 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500"><Trash2 size={30} aria-hidden="true" /></div><h2 id="cart-clear-title" className="mb-2 text-xl font-bold text-gray-900">Clear All Items?</h2><p id="cart-clear-description" className="text-sm leading-relaxed text-gray-500">Remove all <span className="font-semibold text-gray-700">{itemCount} items</span> from your cart?</p></div>
        <div className="flex justify-center gap-3 px-6 pb-6"><button type="button" disabled={clearing} onClick={() => setConfirmClear(false)} className="rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-200 disabled:opacity-60">Cancel</button><button type="button" disabled={clearing} onClick={() => void clearCart()} className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-semibold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70">{clearing && <LoaderCircle size={16} className="animate-spin" />}Remove</button></div>
      </section>
    </div>}
  </div></div>;
}

export default function CartPage() { return <AuthRouteGuard access="signed-in"><CartExperience /></AuthRouteGuard>; }
