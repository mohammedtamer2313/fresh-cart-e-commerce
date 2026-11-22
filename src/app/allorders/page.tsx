"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Box, CalendarDays, ChevronDown, CreditCard, Hash, MapPin, Package, Phone, ReceiptText, ShoppingBag, Truck } from "lucide-react";
import AuthRouteGuard from "@/components/AuthRouteGuard";
import { getSession } from "@/lib/session";
import { getUserOrders } from "@/lib/orders-api";

type OrderProduct = { id: string; title: string; image: string; count: number; price: number };
type Order = {
  id: string;
  date: string;
  total: number;
  status: string;
  paymentMethod: string;
  address: string;
  phone: string;
  shipping: number;
  products: OrderProduct[];
};

const object = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null ? value as Record<string, unknown> : {};

function readOrders(payload: unknown): Order[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((entry) => {
    const row = object(entry);
    const id = row._id ?? row.id;
    if (typeof id !== "string") return [];
    const cartItems = Array.isArray(row.cartItems) ? row.cartItems : Array.isArray(row.products) ? row.products : [];
    const products = cartItems.flatMap((item, itemIndex) => {
      const line = object(item);
      const product = object(line.product ?? line);
      const productId = product._id ?? product.id ?? `${id}-${itemIndex}`;
      return [{
        id: String(productId),
        title: typeof product.title === "string" ? product.title : "Product",
        image: typeof product.imageCover === "string" ? product.imageCover : typeof product.image === "string" ? product.image : "",
        count: typeof line.count === "number" ? line.count : 1,
        price: typeof line.price === "number" ? line.price : typeof product.price === "number" ? product.price : 0,
      }];
    });
    const shipping = object(row.shippingAddress);
    const address = [shipping.details, shipping.city].filter((part): part is string => typeof part === "string" && part.length > 0).join(", ");
    const paymentMethod = row.paymentMethodType === "card" ? "Card" : "Cash";
    const delivered = row.isDelivered === true;
    return [{
      id,
      date: typeof row.createdAt === "string" ? row.createdAt : "",
      total: typeof row.totalOrderPrice === "number" ? row.totalOrderPrice : 0,
      status: delivered ? "Delivered" : paymentMethod === "Card" ? "On the way" : typeof row.status === "string" ? row.status : "Processing",
      paymentMethod,
      address: address || "Shipping address not provided",
      phone: typeof shipping.phone === "string" ? shipping.phone : "",
      shipping: typeof row.shippingPrice === "number" ? row.shippingPrice : 0,
      products,
    }];
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function statusStyle(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes("deliver")) return "bg-green-100 text-green-700";
  if (normalized.includes("way") || normalized.includes("ship")) return "bg-blue-100 text-blue-700";
  if (normalized.includes("cancel")) return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const session = getSession();
    const token = window.localStorage.getItem("userToken") || session?.token;
    if (!token) {
      setFailed(true);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    void getUserOrders(token, controller.signal).then((payload) => setOrders(readOrders(payload))).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  function toggleOrder(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return <main className="min-h-screen bg-gray-50/50">
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-gray-500"><Link className="transition hover:text-primary-600" href="/">Home</Link><span className="text-gray-300">/</span><span className="font-medium text-gray-900">My Orders</span></nav>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25"><Box size={25} /></div><div><h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">My Orders</h1><p className="mt-0.5 text-sm text-gray-500">Track and manage your {orders.length} {orders.length === 1 ? "order" : "orders"}</p></div></div>
          <Link href="/products" className="flex self-start items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary-600 transition hover:bg-primary-50 sm:self-auto"><ShoppingBag size={15} />Continue Shopping</Link>
        </div>
      </header>

      {loading ? <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500">Loading your orders...</div> : failed ? <div className="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center"><Package className="mx-auto mb-4 text-gray-300" size={42} /><h2 className="font-semibold text-gray-900">We couldn’t load your orders</h2><p className="mt-2 text-sm text-gray-500">Please try again in a moment.</p></div> : orders.length === 0 ? <div className="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center"><Package className="mx-auto mb-4 text-gray-300" size={42} /><h2 className="font-semibold text-gray-900">No orders yet</h2><p className="mt-2 text-sm text-gray-500">Your completed checkouts will appear here.</p><Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700">Browse products <ArrowRight size={16} /></Link></div> : <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expanded.has(order.id);
          const leadProduct = order.products[0];
          const quantity = order.products.reduce((sum, product) => sum + product.count, 0);
          return <article key={order.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-gray-200 hover:shadow-md">
            <div className="p-5 sm:p-6"><div className="flex gap-4 sm:gap-5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-2.5 sm:h-28 sm:w-28">{leadProduct?.image ? <img src={leadProduct.image} alt={leadProduct.title} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-gray-300"><Package size={32} /></div>}{order.products.length > 1 && <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-900 px-1 text-xs font-bold text-white shadow-lg">+{order.products.length - 1}</span>}</div>
              <div className="min-w-0 flex-1"><div className="mb-3 flex items-start justify-between gap-3"><div className="min-w-0"><span className={`mb-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${statusStyle(order.status)}`}>{order.status}</span><h2 className="flex items-center gap-2 truncate text-lg font-bold text-gray-900"><Hash size={13} className="shrink-0 text-gray-400" />{order.id.slice(-8)}</h2></div><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${order.paymentMethod === "Card" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600"}`}>{order.paymentMethod === "Card" ? <CreditCard size={19} /> : <span className="text-sm font-bold">EGP</span>}</span></div>
                <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-500"><span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-gray-400" />{order.date ? new Date(order.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Date unavailable"}</span><span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block" /><span className="flex items-center gap-1.5"><Box size={14} className="text-gray-400" />{quantity} {quantity === 1 ? "item" : "items"}</span><span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block" /><span className="flex min-w-0 items-center gap-1.5"><MapPin size={14} className="shrink-0 text-gray-400" /><span className="truncate">{order.address}</span></span></div>
                <div className="flex items-center justify-between gap-3"><div><span className="text-2xl font-bold text-gray-900">{order.total.toLocaleString()}</span><span className="ml-1 text-sm font-medium text-gray-400">EGP</span></div><button type="button" onClick={() => toggleOrder(order.id)} aria-expanded={isExpanded} className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200">{isExpanded ? "Hide details" : "Details"}<ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button></div>
              </div>
            </div></div>
            {isExpanded && <div className="border-t border-gray-100 bg-gray-50/50"><div className="p-5 sm:p-6"><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-100 text-primary-600"><ReceiptText size={13} /></span>Order Items</h3>{order.products.length ? <div className="space-y-3">{order.products.map((product) => <div key={product.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4"><div className="h-16 w-16 shrink-0 rounded-xl bg-gray-50 p-2">{product.image && <img src={product.image} alt={product.title} className="h-full w-full object-contain" />}</div><div className="min-w-0 flex-1"><p className="truncate font-medium text-gray-900">{product.title}</p><p className="mt-1 text-sm text-gray-500"><span className="font-medium text-gray-700">{product.count}</span> × {product.price.toLocaleString()} EGP</p></div><div className="shrink-0 text-right"><p className="text-lg font-bold text-gray-900">{(product.price * product.count).toLocaleString()}</p><p className="text-xs text-gray-400">EGP</p></div></div>)}</div> : <p className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-500">Item details aren’t available for this order.</p>}</div><div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6"><section className="rounded-xl border border-gray-100 bg-white p-4"><h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><MapPin size={13} /></span>Delivery Address</h4><div className="space-y-2"><p className="text-sm leading-relaxed text-gray-600">{order.address}</p>{order.phone && <p className="flex items-center gap-2 pt-1 text-sm text-gray-600"><Phone size={13} className="text-gray-400" />{order.phone}</p>}</div></section><section className="rounded-xl border border-blue-200 bg-blue-100 p-4"><h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500 text-white"><Truck size={13} /></span>Order Summary</h4><div className="space-y-2 text-sm"><div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium">{order.products.reduce((sum, product) => sum + product.price * product.count, 0).toLocaleString()} EGP</span></div><div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-medium">{order.shipping === 0 ? "Free" : `${order.shipping.toLocaleString()} EGP`}</span></div><hr className="my-2 border-gray-200/50" /><div className="flex justify-between pt-1"><span className="font-semibold text-gray-900">Total</span><span className="text-lg font-bold text-gray-900">{order.total.toLocaleString()} EGP</span></div></div></section></div></div>}
          </article>;
        })}
      </div>}
    </div>
  </main>;
}

export default function OrdersPage() {
  return <AuthRouteGuard access="signed-in"><OrdersContent /></AuthRouteGuard>;
}
