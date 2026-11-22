"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { LoaderCircle, ShoppingCart } from "lucide-react";

type Theme = { gradient: string; iconBg: string; text: string; bar: string };
const themes: Record<string, Theme> = {
  primary: { gradient: "from-primary-600 via-primary-500 to-primary-400", iconBg: "bg-white/20", text: "text-primary-600", bar: "bg-primary-500" },
  violet: { gradient: "from-violet-600 via-violet-500 to-purple-400", iconBg: "bg-white/20", text: "text-violet-600", bar: "bg-violet-500" },
  red: { gradient: "from-rose-600 via-red-500 to-rose-400", iconBg: "bg-white/20", text: "text-rose-600", bar: "bg-rose-500" },
};

function pageDetails(path: string) {
  const route = path.split("/").filter(Boolean)[0] ?? "home";
  const config: Record<string, { title: string; theme: keyof typeof themes }> = {
    home: { title: "Home", theme: "primary" }, products: { title: "Products", theme: "primary" },
    categories: { title: "Categories", theme: "primary" }, brands: { title: "Top Brands", theme: "violet" },
    wishlist: { title: "My Wishlist", theme: "red" }, cart: { title: "Shopping Cart", theme: "primary" },
    orders: { title: "Order History", theme: "primary" }, profile: { title: "My Account", theme: "primary" },
    support: { title: "Contact Us", theme: "primary" }, privacy: { title: "Privacy Policy", theme: "primary" },
    terms: { title: "Terms of Service", theme: "primary" }, cookies: { title: "Cookie Policy", theme: "primary" },
    checkout: { title: "Checkout", theme: "primary" },
    login: { title: "Sign In", theme: "primary" }, signup: { title: "Create Account", theme: "primary" },
    register: { title: "Create Account", theme: "primary" },
  };
  return config[route] ?? { title: "Loading", theme: "primary" as const };
}

function LoadingContent() {
  const pathname = usePathname();
  const { title, theme: themeName } = pageDetails(pathname);
  const theme = themes[themeName];

  return <div role="status" aria-live="polite" aria-label={`Loading ${title}`} className="min-h-[calc(100dvh-4rem)] bg-gray-50/70">
    <div className={`bg-linear-to-br ${theme.gradient} text-white`}><div className="container mx-auto px-4 py-10 sm:py-14">
      <div className="mb-5 h-4 w-36 animate-pulse rounded bg-white/25" />
      <div className="flex items-center gap-4"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme.iconBg} ring-1 ring-white/30`}><ShoppingCart size={25} aria-hidden="true" /></div><div><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-white/80">Getting everything ready for you...</p></div></div>
    </div></div>
    <div className="container mx-auto px-4 py-8" aria-hidden="true">
      <div className="mb-6 flex items-center gap-3"><LoaderCircle size={19} className={`animate-spin ${theme.text}`} /><span className="text-sm font-medium text-gray-500">Loading {title.toLowerCase()}...</span></div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 10 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-xs"><div className="aspect-square animate-pulse rounded-xl bg-gray-100" /><div className="mt-4 h-3 w-3/4 animate-pulse rounded bg-gray-100" /><div className="mt-3 flex items-center justify-between"><div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" /><div className={`h-8 w-8 animate-pulse rounded-full ${theme.bar} opacity-20`} /></div></div>)}</div>
    </div>
  </div>;
}

function LoadingFallback() {
  const theme = themes.primary;

  return <div role="status" aria-live="polite" aria-label="Loading" className="min-h-[calc(100dvh-4rem)] bg-gray-50/70">
    <div className={`bg-linear-to-br ${theme.gradient} text-white`}><div className="container mx-auto px-4 py-10 sm:py-14">
      <div className="mb-5 h-4 w-36 animate-pulse rounded bg-white/25" />
      <div className="flex items-center gap-4"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme.iconBg} ring-1 ring-white/30`}><ShoppingCart size={25} aria-hidden="true" /></div><div><h1 className="text-2xl font-bold sm:text-3xl">Loading</h1><p className="mt-1 text-sm text-white/80">Getting everything ready for you...</p></div></div>
    </div></div>
    <div className="container mx-auto px-4 py-8" aria-hidden="true"><div className="mb-6 flex items-center gap-3"><LoaderCircle size={19} className={`animate-spin ${theme.text}`} /><span className="text-sm font-medium text-gray-500">Loading...</span></div></div>
  </div>;
}

export default function PageLoading() {
  return <Suspense fallback={<LoadingFallback />}><LoadingContent /></Suspense>;
}
