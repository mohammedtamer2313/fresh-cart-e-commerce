"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Package, ShoppingCart } from "lucide-react";
import AuthRouteGuard from "@/components/AuthRouteGuard";
import { getSession } from "@/lib/session";
import { getUserOrders } from "@/lib/orders-api";

type Kind = "orders" | "wishlist" | "cart";
type Row = { id: string; title: string; image: string; detail: string };
const config = {
  orders: { title: "Order History", icon: Package, empty: "You have not placed any orders yet." },
  wishlist: { title: "Wishlist", icon: Heart, empty: "Your wishlist is empty. Save products with the heart button." },
  cart: { title: "Shopping Cart", icon: ShoppingCart, empty: "Your cart is empty. Add products to start shopping." },
};
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");
const asObject = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null ? value as Record<string, unknown> : {};

function normalizeRows(kind: Kind, payload: unknown): Row[] {
  const root = asObject(payload);
  const data = asObject(root.data);
  const raw = Array.isArray(root.data) ? root.data : Array.isArray(data.products) ? data.products : Array.isArray(data.data) ? data.data : [];
  return raw.flatMap((entry, index) => {
    const row = asObject(entry);
    if (kind === "orders") return [{ id: String(row._id ?? index), title: `Order #${String(row._id ?? "").slice(-8)}`, image: "", detail: `${row.status ?? "Order placed"} · ${row.totalOrderPrice ?? ""} EGP` }];
    const product = asObject(row.product ?? row);
    const id = product._id ?? product.id ?? row._id ?? index;
    const title = typeof product.title === "string" ? product.title : "Product";
    const image = typeof product.imageCover === "string" ? product.imageCover : typeof product.image === "string" ? product.image : "";
    const price = typeof product.price === "number" ? `${product.price} EGP` : "";
    return [{ id: String(id), title, image, detail: kind === "cart" && typeof row.count === "number" ? `Qty ${row.count} · ${price}` : price }];
  });
}

export default function AccountListPage({ kind }: { kind: Kind }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { title, icon: Icon, empty } = config[kind];

  useEffect(() => {
    const session = getSession();
    const token = window.localStorage.getItem("userToken") || session?.token;
    if (!token) return;
    if (kind === "orders") {
      void getUserOrders(token)
        .then((payload) => setRows(normalizeRows(kind, payload)))
        .catch(() => setFailed(true))
        .finally(() => setLoading(false));
      return;
    }
    const path = `/${kind === "cart" ? "cart" : "wishlist"}`;
    void fetch(`${API_BASE}${path}`, { headers: { token } })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load account items");
        return await response.json() as unknown;
      })
      .then((payload) => setRows(normalizeRows(kind, payload)))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [kind]);

  return <AuthRouteGuard access="signed-in"><main className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
    <div className="mb-8 flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><Icon /></span><div><h1 className="text-3xl font-bold text-gray-900">{title}</h1><p className="mt-1 text-sm text-gray-500">Your FreshCart account</p></div></div>
    {loading ? <p className="rounded-xl bg-white p-8 text-center text-gray-500">Loading…</p> : failed ? <p className="rounded-xl bg-white p-8 text-center text-gray-600">Could not load this section right now.</p> : rows.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((row) => <article key={row.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-xs">{row.image ? <img src={row.image} alt="" className="h-16 w-16 rounded-lg bg-gray-50 object-contain" /> : <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-50 text-gray-400"><Icon /></span>}<div className="min-w-0"><h2 className="truncate font-semibold text-gray-900">{row.title}</h2><p className="mt-1 text-sm text-gray-500">{row.detail}</p></div></article>)}</div> : <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-xs"><p className="text-gray-600">{failed ? "Could not load this section right now." : empty}</p><Link href="/products" className="mt-5 inline-flex rounded-full bg-primary-600 px-5 py-2.5 font-semibold text-white hover:bg-primary-700">Browse products</Link></div>}
  </main></AuthRouteGuard>;
}
