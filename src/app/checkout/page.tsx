"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check, CreditCard, Home, Info, LoaderCircle, LockKeyhole, MapPin, PackageCheck, ReceiptText, ShieldCheck, ShoppingBag, Truck, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import AuthRouteGuard from "@/components/AuthRouteGuard";
import PageLoading from "@/components/PageLoading";
import { getSession } from "@/lib/session";
import { getShippingFee } from "@/lib/cart-pricing";

type Item = { id: string; title: string; image: string; price: number; count: number };
const API = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");
const CART_API = API.endsWith("/api/v1") ? API.replace(/\/api\/v1$/, "/api/v2") : API;
const API_V1 = API;
const API_V2 = (process.env.NEXT_PUBLIC_API_V2_URL ?? (API.endsWith("/api/v1") ? API.replace(/\/api\/v1$/, "/api/v2") : "https://ecommerce.routemisr.com/api/v2")).replace(/\/$/, "");
const obj = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null ? value as Record<string, unknown> : {};

function CheckoutExperience() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cartId, setCartId] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [payment, setPayment] = useState<"cash" | "online">("cash");
  const [city, setCity] = useState("");
  const [details, setDetails] = useState("");
  const [phone, setPhone] = useState("");

  const loadCart = useCallback(async () => {
    const session = getSession();
    if (!session?.token) {
      setLoadError("Please sign in again to load your cart.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`${CART_API}/cart`, { headers: { token: session.token, "Cache-Control": "no-cache" }, cache: "no-store" });
      if (!response.ok) throw new Error("Could not load your cart");
      const data = obj(obj(await response.json() as unknown).data);
      setCartId(typeof data._id === "string" ? data._id : typeof data.id === "string" ? data.id : "");
      const cartRows = Array.isArray(data.products) ? data.products : Array.isArray(data.items) ? data.items : [];
      setItems(cartRows.flatMap((entry) => {
        const row = obj(entry); const product = obj(row.product ?? row.productId ?? row.item ?? row); const id = product._id ?? product.id ?? row.productId;
        if (typeof id !== "string") return [];
        const discountedPrice = row.priceAfterDiscount ?? product.priceAfterDiscount;
        const regularPrice = row.price ?? product.price;
        const price = typeof discountedPrice === "number" && discountedPrice > 0 ? discountedPrice : typeof regularPrice === "number" ? regularPrice : 0;
        return [{ id, title: typeof product.title === "string" ? product.title : "Product", image: typeof product.imageCover === "string" ? product.imageCover : "", price, count: typeof row.count === "number" ? row.count : typeof row.quantity === "number" ? row.quantity : 1 }];
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load your order details.";
      setLoadError(message);
      toast.error(message);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadCart(); }, [loadCart]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.count, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.count, 0), [items]);
  const shipping = getShippingFee(subtotal);
  const total = subtotal + shipping;

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getSession();
    if (!session?.token || !cartId || !items.length) { toast.error("Your cart is empty"); return; }
    setSubmitting(true);
    const shippingAddress = { details: details.trim(), phone: phone.trim(), city: city.trim() };
    try {
      const endpoint = payment === "cash"
        ? `${API_V2}/orders/${encodeURIComponent(cartId)}`
        : `${API_V1}/orders/checkout-session/${encodeURIComponent(cartId)}?url=${encodeURIComponent(window.location.origin)}`;
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", token: session.token }, body: JSON.stringify({ shippingAddress }) });
      const result = obj(await response.json() as unknown);
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Could not place your order");
      if (payment === "online") {
        const data = obj(result.data);
        const sessionInfo = obj(data.session ?? result.session);
        const sessionUrl = typeof sessionInfo.url === "string" ? sessionInfo.url : typeof data.url === "string" ? data.url : null;
        if (!sessionUrl) throw new Error("Payment session was not returned. Please try again.");
        window.location.assign(sessionUrl);
        return;
      }
      window.dispatchEvent(new Event("freshcart-cart-change"));
      toast.success("Your order has been placed successfully");
      router.push("/allorders");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not place your order.";
      toast.error(message);
    }
    finally { setSubmitting(false); }
  }

  if (loading) return <PageLoading />;

  if (loadError) return <main className="container mx-auto px-4 py-16"><section role="alert" className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xs"><h1 className="text-xl font-bold text-gray-900">Could not load checkout</h1><p className="mt-2 text-sm text-gray-600">{loadError}</p><button type="button" onClick={() => void loadCart()} className="mt-6 rounded-xl bg-primary-600 px-5 py-2.5 font-semibold text-white transition hover:bg-primary-700">Try again</button></section></main>;

  return <main className="min-h-screen bg-linear-to-b from-gray-50 to-white py-8"><div className="container mx-auto px-4">
    <header className="mb-8"><nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-gray-500"><Link href="/" className="transition hover:text-primary-600">Home</Link><span className="text-gray-300">/</span><Link href="/cart" className="transition hover:text-primary-600">Cart</Link><span className="text-gray-300">/</span><span className="font-medium text-gray-900">Checkout</span></nav><div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/20"><ReceiptText size={23} /></span>Complete Your Order</h1><p className="mt-2 text-gray-500">Review your items and complete your purchase</p></div><Link href="/cart" className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-primary-600 transition-all hover:bg-primary-50"><ArrowLeft size={17} />Back to Cart</Link></div></header>
    {!items.length ? <section className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-xs"><ShoppingBag size={32} className="mx-auto text-gray-300" /><h2 className="mt-4 text-xl font-bold text-gray-900">Your cart is empty</h2><p className="mt-2 text-gray-500">Add products to your cart before checking out.</p><Link href="/products" className="mt-6 inline-flex rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700">Browse Products</Link></section> : <form onSubmit={placeOrder}><div className="grid grid-cols-1 gap-8 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2">
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs"><div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 py-4 text-white"><h2 className="flex items-center gap-2 text-lg font-bold"><Home size={19} />Shipping Address</h2><p className="mt-1 text-sm text-primary-100">Where should we deliver your order?</p></div><div className="space-y-5 p-6"><div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Info size={16} /></span><div><p className="text-sm font-medium text-blue-800">Delivery Information</p><p className="mt-0.5 text-xs text-blue-600">Please ensure your address is accurate for smooth delivery.</p></div></div>
        <div><label htmlFor="checkout-city" className="mb-2 block text-sm font-semibold text-gray-700">City <span className="text-red-500">*</span></label><div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input id="checkout-city" name="city" autoComplete="address-level2" required value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Cairo, Alexandria, Giza" className="w-full rounded-xl border-2 border-gray-200 py-3.5 pl-12 pr-4 outline-hidden transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /></div></div>
        <div><label htmlFor="checkout-details" className="mb-2 block text-sm font-semibold text-gray-700">Street Address <span className="text-red-500">*</span></label><div className="relative"><MapPin className="absolute left-4 top-4 text-gray-400" size={18} /><textarea id="checkout-details" name="details" autoComplete="street-address" rows={3} required value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Street name, building number, floor, apartment..." className="w-full resize-none rounded-xl border-2 border-gray-200 py-3.5 pl-12 pr-4 outline-hidden transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /></div></div>
        <div><label htmlFor="checkout-phone" className="mb-2 block text-sm font-semibold text-gray-700">Phone Number <span className="text-red-500">*</span></label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+20</span><input id="checkout-phone" name="phone" type="tel" autoComplete="tel-national" inputMode="numeric" pattern="01[0-9]{9}" title="Enter an 11-digit Egyptian mobile number starting with 01" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01xxxxxxxxx" className="w-full rounded-xl border-2 border-gray-200 py-3.5 pl-14 pr-4 outline-hidden transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">Egyptian numbers only</span></div></div>
      </div></section>
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs"><div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 py-4 text-white"><h2 className="flex items-center gap-2 text-lg font-bold"><Wallet size={19} />Payment Method</h2><p className="mt-1 text-sm text-primary-100">Choose how you&apos;d like to pay</p></div><div className="space-y-4 p-6">
        <button type="button" onClick={() => setPayment("cash")} className={`group flex w-full items-center gap-4 rounded-xl border-2 p-5 text-left transition-all ${payment === "cash" ? "border-primary-500 bg-linear-to-r from-primary-50 to-emerald-50 shadow-xs" : "border-gray-200 hover:border-primary-200 hover:bg-gray-50"}`}><span className={`flex h-14 w-14 items-center justify-center rounded-xl ${payment === "cash" ? "bg-linear-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}><Wallet size={23} /></span><span className="flex-1"><span className={`block font-bold ${payment === "cash" ? "text-primary-700" : "text-gray-900"}`}>Cash on Delivery</span><span className="mt-0.5 block text-sm text-gray-500">Pay when your order arrives at your doorstep</span></span><span className={`flex h-7 w-7 items-center justify-center rounded-full ${payment === "cash" ? "bg-primary-600 text-white" : "border-2 border-gray-200"}`}>{payment === "cash" && <Check size={15} />}</span></button>
        <button type="button" onClick={() => setPayment("online")} className={`group flex w-full items-center gap-4 rounded-xl border-2 p-5 text-left transition-all ${payment === "online" ? "border-primary-500 bg-linear-to-r from-primary-50 to-emerald-50 shadow-xs" : "border-gray-200 hover:border-primary-200 hover:bg-gray-50"}`}><span className={`flex h-14 w-14 items-center justify-center rounded-xl ${payment === "online" ? "bg-linear-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}><CreditCard size={23} /></span><span className="flex-1"><span className={`block font-bold ${payment === "online" ? "text-primary-700" : "text-gray-900"}`}>Pay Online</span><span className="mt-0.5 block text-sm text-gray-500">Secure payment with credit or debit card</span><span className="mt-2 flex gap-2 text-xs font-bold text-gray-400">VISA <span className="text-red-500">●●</span> MasterCard</span></span><span className={`flex h-7 w-7 items-center justify-center rounded-full ${payment === "online" ? "bg-primary-600 text-white" : "border-2 border-gray-200"}`}>{payment === "online" && <Check size={15} />}</span></button>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-green-100 bg-linear-to-r from-green-50 to-emerald-50 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600"><ShieldCheck size={19} /></span><div><p className="text-sm font-medium text-green-800">Secure &amp; Encrypted</p><p className="mt-0.5 text-xs text-green-600">Your payment information is processed securely.</p></div></div>
      </div></section>
    </div><aside className="lg:col-span-1"><section className="sticky top-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs"><div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 py-4 text-white"><h2 className="flex items-center gap-2 text-lg font-bold"><ShoppingBag size={18} />Order Summary</h2><p className="mt-1 text-sm text-primary-100">{itemCount} {itemCount === 1 ? "item" : "items"}</p></div><div className="p-5"><div className="mb-5 max-h-56 space-y-3 overflow-y-auto pr-1">{items.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100"><div className="h-14 w-14 shrink-0 rounded-lg border border-gray-100 bg-white p-1">{item.image && <img src={item.image} alt={item.title} className="h-full w-full object-contain" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900">{item.title}</p><p className="mt-0.5 text-xs text-gray-500">{item.count} × {item.price} EGP</p></div><p className="shrink-0 text-sm font-bold text-gray-900">{(item.count * item.price).toLocaleString()}</p></div>)}</div><hr className="my-4 border-gray-100" /><div className="space-y-3"><div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium">{subtotal.toLocaleString()} EGP</span></div><div className="flex justify-between text-gray-600"><span className="flex items-center gap-2"><Truck size={16} className="text-gray-400" />Shipping</span><span className={`font-semibold ${shipping === 0 ? "text-green-600" : "text-gray-900"}`}>{shipping === 0 ? "FREE" : `${shipping} EGP`}</span></div><hr className="border-gray-100" /><div className="flex items-center justify-between"><span className="text-lg font-bold text-gray-900">Total</span><span className="text-2xl font-bold text-primary-600">{total.toLocaleString()} <span className="text-sm font-normal text-gray-500">EGP</span></span></div></div><button type="submit" disabled={submitting || !cartId} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary-600 to-primary-700 py-4 font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:from-primary-700 hover:to-primary-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70">{submitting ? <LoaderCircle size={18} className="animate-spin" /> : payment === "cash" ? <PackageCheck size={18} /> : <LockKeyhole size={17} />}{submitting ? "Processing..." : payment === "cash" ? "Place Order" : "Continue to Payment"}</button><div className="mt-4 flex items-center justify-center gap-4 border-t border-gray-100 py-3 text-xs text-gray-500"><span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-500" />Secure</span><span className="h-4 w-px bg-gray-200" /><span className="flex items-center gap-1.5"><Truck size={14} className="text-blue-500" />Fast Delivery</span><span className="h-4 w-px bg-gray-200" /><span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-orange-500" />Returns</span></div></div></section></aside></div></form>}
  </div></main>;
}

export default function CheckoutPage() { return <AuthRouteGuard access="signed-in"><CheckoutExperience /></AuthRouteGuard>; }
