"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronDown,
  CircleUser,
  Gift,
  Headphones,
  Heart,
  Mail,
  Package,
  Phone,
  Search,
  Settings as SettingsIcon,
  ShoppingCart,
  Truck,
  User,
  UserPlus,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { AUTH_STATE_CHANGE_EVENT, notifyAuthStateChange } from "@/lib/auth-state";
import { getSession, removeSession } from "@/lib/session";
import type { StoreCategory } from "@/lib/store-api";

function SearchForm() {
  return (
    <form action="/search" method="get" role="search" className="hidden max-w-2xl flex-1 lg:flex">
      <div className="relative w-full">
        <input
          name="q"
          type="search"
          aria-label="Search products"
          placeholder="Search for products, brands and more..."
          className="w-full rounded-full border border-gray-200 bg-gray-50/50 px-5 py-3 pr-12 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
        />
        <button type="submit" aria-label="Search" className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700">
          <Search size={16} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

function SupportLink({ onClick, mobile = false }: { onClick?: () => void; mobile?: boolean }) {
  return (
    <Link href="/support" onClick={onClick} className={`${mobile ? "flex" : "hidden border-r border-gray-200 pr-3 lg:flex"} items-center gap-2 transition-opacity hover:opacity-80`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        <Headphones size={20} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="text-xs leading-tight">
        <span className="block text-gray-400">Support</span>
        <span className="font-semibold text-gray-700">Contact Us</span>
      </span>
    </Link>
  );
}

function CategoryDropdown({
  categories,
  open,
  onToggle,
  onClose,
}: {
  categories: StoreCategory[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const featuredCategories = categories.filter((category) => {
    const name = category.name.toLowerCase().replace(/[’']/g, "");
    return name === "electronics" || name === "mens fashion" || name === "womens fashion";
  });

  return (
    <div className="group relative">
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={onToggle} className="flex items-center gap-1.5 py-2 font-medium text-gray-700 transition-colors hover:text-primary-600">
        Categories
        <ChevronDown size={12} className={`transition-transform group-hover:rotate-180 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div className={`absolute left-0 top-full z-50 pt-1 transition-all duration-200 ${open ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"}`}>
        <div role="menu" className="min-w-50 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
          <Link role="menuitem" href="/categories" onClick={onClose} className="block px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-600">All Categories</Link>
          {featuredCategories.map((category) => (
            <Link key={category.id} role="menuitem" href={`/products?category=${category.id}`} onClick={onClose} className="block px-4 py-2.5 text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600">
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Navbar({ categories = [] }: { categories?: StoreCategory[] }) {
  const router = useRouter();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const featuredCategories = categories.filter((category) => {
    const name = category.name.toLowerCase().replace(/[’']/g, "");
    return name === "electronics" || name === "mens fashion" || name === "womens fashion";
  });
  const closeMenus = () => {
    setCategoriesOpen(false);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const syncAuthState = () => {
      const session = getSession();
      setUserName(session ? session.user.name || session.user.email || "My Profile" : null);
      setUserEmail(session?.user.email ?? "");
      if (!session) {
        setCartCount(0);
        setWishlistCount(0);
        return;
      }
      const base = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");
      const cartBase = base.endsWith("/api/v1") ? base.replace(/\/api\/v1$/, "/api/v2") : base;
      void fetch(`${cartBase}/cart`, { headers: { token: session.token, "Cache-Control": "no-cache" }, cache: "no-store", signal: AbortSignal.timeout(8000) })
        .then(async (response) => {
          if (response.status === 401 || response.status === 404) { setCartCount(0); return null; }
          return response.ok ? await response.json() as unknown : null;
        })
        .then((body) => {
          if (typeof body !== "object" || body === null || !("data" in body)) return;
          const payload = body.data;
          if (typeof payload !== "object" || payload === null) return;
          if ("numOfCartItems" in payload && typeof payload.numOfCartItems === "number") setCartCount(payload.numOfCartItems);
          else if ("products" in payload && Array.isArray(payload.products)) setCartCount(payload.products.length);
        })
        .catch(() => undefined);
      void fetch(`${base}/wishlist`, { headers: { token: session.token } })
        .then(async (response) => response.ok ? await response.json() as unknown : null)
        .then((body) => {
          if (typeof body !== "object" || body === null || !("data" in body)) return;
          const payload = body.data;
          if (Array.isArray(payload)) setWishlistCount(payload.length);
          else if (typeof payload === "object" && payload !== null) {
            const data = payload as Record<string, unknown>;
            if (Array.isArray(data.data)) setWishlistCount(data.data.length);
            else if (Array.isArray(data.products)) setWishlistCount(data.products.length);
            else if (typeof data.count === "number") setWishlistCount(data.count);
          }
        })
        .catch(() => undefined);
    };

    syncAuthState();
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
    window.addEventListener("freshcart-cart-change", syncAuthState);
    window.addEventListener("freshcart-wishlist-change", syncAuthState);
    window.addEventListener("storage", syncAuthState);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
      window.removeEventListener("freshcart-cart-change", syncAuthState);
      window.removeEventListener("freshcart-wishlist-change", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  function signOut() {
    removeSession();
    window.localStorage.removeItem("rememberMe");
    notifyAuthStateChange();
    closeMenus();
    setAccountMenuOpen(false);
    toast.success("Signed out successfully.");
    router.replace("/");
  }

  return (
    <>
      <div className="hidden border-b border-gray-100 text-sm lg:block">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between">
            <div className="flex items-center gap-6 text-gray-500">
              <span className="flex items-center gap-2"><Truck size={13} className="text-primary-600" aria-hidden="true" /><span>Free Shipping on Orders 500 EGP</span></span>
              <span className="flex items-center gap-2"><Gift size={13} className="text-primary-600" aria-hidden="true" /><span>New Arrivals Daily</span></span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-gray-500">
                <a href="tel:+201015815442" className="flex items-center gap-1.5 transition-colors hover:text-primary-600"><Phone size={13} aria-hidden="true" /><span>+201015815442</span></a>
                <a href="mailto:mohammedtamer2313@gmail.com" className="flex items-center gap-1.5 transition-colors hover:text-primary-600"><Mail size={13} aria-hidden="true" /><span>mohammedtamer2313@gmail.com</span></a>
              </div>
              <span className="h-4 w-px bg-gray-200" aria-hidden="true" />
              <div className="flex items-center gap-4">
                {userName ? <>
                  <Link href="/profile" className="flex max-w-48 items-center gap-1.5 truncate text-gray-600 transition-colors hover:text-primary-600"><User size={13} aria-hidden="true" /><span className="truncate">{userName}</span></Link>
                  <button type="button" onClick={signOut} className="flex items-center gap-1.5 text-gray-600 transition-colors hover:text-red-500"><LogOut size={13} aria-hidden="true" /><span>Sign Out</span></button>
                </> : <>
                  <Link href="/login" className="flex items-center gap-1.5 text-gray-600 transition-colors hover:text-primary-600"><User size={13} aria-hidden="true" /><span>Sign In</span></Link>
                  <Link href="/register" className="flex items-center gap-1.5 text-gray-600 transition-colors hover:text-primary-600"><UserPlus size={13} aria-hidden="true" /><span>Sign Up</span></Link>
                </>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white shadow-xs">
        <div className="bg-white">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between gap-4 lg:h-18 lg:gap-8">
              <Link href="/" aria-label="FreshCart home" className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-gray-900">
                <ShoppingCart size={25} strokeWidth={2.2} className="text-primary-600" aria-hidden="true" />
                <span>FreshCart</span>
              </Link>

              <SearchForm />

              <nav aria-label="Main navigation" className="hidden items-center gap-6 xl:flex">
                <Link className="font-medium text-gray-700 transition-colors hover:text-primary-600" href="/">Home</Link>
                <Link className="font-medium text-gray-700 transition-colors hover:text-primary-600" href="/products">Shop</Link>
                <CategoryDropdown categories={categories} open={categoriesOpen} onToggle={() => setCategoriesOpen((open) => !open)} onClose={() => setCategoriesOpen(false)} />
                <Link className="font-medium text-gray-700 transition-colors hover:text-primary-600" href="/brands">Brands</Link>
              </nav>

              <div className="flex items-center gap-1 lg:gap-2">
                <SupportLink />
                <Link href="/wishlist" aria-label={`Wishlist, ${wishlistCount} items`} title="Wishlist" className="group relative rounded-full p-2.5 transition-colors hover:bg-gray-100">
                  <Heart size={21} strokeWidth={1.8} className="text-gray-500 transition-colors group-hover:text-primary-600" aria-hidden="true" />
                  {wishlistCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">{wishlistCount}</span>}
                </Link>
                <Link href="/cart" prefetch={false} aria-label={`Cart, ${cartCount} items`} title="Cart" className="group relative rounded-full p-2.5 transition-colors hover:bg-gray-100">
                  <ShoppingCart size={21} strokeWidth={2.2} className="text-gray-500 transition-colors group-hover:text-primary-600" aria-hidden="true" />
                  {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold leading-none text-white">{cartCount}</span>}
                </Link>
                {userName ? <div className="group/account relative hidden lg:block">
                  <button type="button" title="Account" aria-label="Open account menu" aria-haspopup="true" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)} className="group relative rounded-full p-2.5 transition-colors hover:bg-gray-100">
                    <CircleUser size={22} strokeWidth={1.8} className="text-gray-500 transition-colors group-hover:text-primary-600" aria-hidden="true" />
                  </button>
                  <div className={`absolute right-0 top-full z-50 pt-2 transition-all duration-200 origin-top-right ${accountMenuOpen ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0 group-hover/account:visible group-hover/account:scale-100 group-hover/account:opacity-100 group-focus-within/account:visible group-focus-within/account:scale-100 group-focus-within/account:opacity-100"}`}>
                    <div className="w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                      <div className="border-b border-gray-100 p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600"><CircleUser size={22} aria-hidden="true" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-800">{userName}</p><p className="truncate text-xs text-gray-400">{userEmail}</p></div></div></div>
                      <div className="py-2">
                        <Link href="/profile" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600"><User size={16} className="w-4 text-gray-400" aria-hidden="true" />My Profile</Link>
                        <Link href="/orders" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600"><Package size={16} className="w-4 text-gray-400" aria-hidden="true" />My Orders</Link>
                        <Link href="/wishlist" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600"><Heart size={16} className="w-4 text-gray-400" aria-hidden="true" />My Wishlist</Link>
                        <Link href="/cart" prefetch={false} onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600"><ShoppingCart size={16} className="w-4 text-gray-400" aria-hidden="true" />Shopping Cart</Link>
                        <Link href="/profile/settings" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600"><SettingsIcon size={16} className="w-4 text-gray-400" aria-hidden="true" />Settings</Link>
                      </div>
                      <div className="border-t border-gray-100 py-2"><button type="button" onClick={signOut} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50"><LogOut size={16} className="w-4" aria-hidden="true" />Sign Out</button></div>
                    </div>
                  </div>
                </div> : <Link href="/login" className="ml-2 hidden items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs shadow-primary-600/20 transition-colors hover:bg-primary-700 xl:flex"><User size={13} aria-hidden="true" />Sign In</Link>}
                <button type="button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen((open) => !open)} className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700 xl:hidden">
                  {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
        </div>

      </header>

      <div aria-hidden={!mobileMenuOpen} className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 xl:hidden ${mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <button type="button" tabIndex={mobileMenuOpen ? 0 : -1} disabled={!mobileMenuOpen} aria-label="Close navigation menu" onClick={closeMenus} className="h-full w-full cursor-default" />
      </div>

      <aside
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
        inert={!mobileMenuOpen}
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 xl:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
          <Link href="/" onClick={closeMenus} aria-label="FreshCart home" className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900">
            <ShoppingCart size={24} className="text-green-600" aria-hidden="true" />FreshCart
          </Link>
          <button type="button" aria-label="Close menu" onClick={closeMenus} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form action="/search" method="get" role="search" className="border-b border-gray-100 p-4">
          <div className="relative">
            <input name="q" type="search" placeholder="Search products..." aria-label="Search products" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm outline-hidden focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-600/20" />
            <button type="submit" aria-label="Search" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-green-600 text-white">
              <Search size={16} aria-hidden="true" />
            </button>
          </div>
        </form>

        <nav aria-label="Mobile links" className="space-y-1 p-4">
          <Link href="/" onClick={closeMenus} className="block rounded-xl px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-600">Home</Link>
          <Link href="/products" onClick={closeMenus} className="block rounded-xl px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-600">Shop</Link>
          <Link href="/categories" onClick={closeMenus} className="block rounded-xl px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-600">All Categories</Link>
          {featuredCategories.map((category) => <Link key={category.id} href={`/products?category=${category.id}`} onClick={closeMenus} className="block rounded-xl px-7 py-2 font-medium text-gray-600 transition-colors hover:bg-green-50 hover:text-green-600">{category.name}</Link>)}
          <Link href="/brands" onClick={closeMenus} className="block rounded-xl px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-600">Brands</Link>
        </nav>

        <div className="mx-4 border-t border-gray-100" />

        <div className="space-y-1 p-4">
          <Link href="/wishlist" onClick={closeMenus} className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-green-50">
            <span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50"><Heart size={18} className="text-red-500" aria-hidden="true" /></span><span className="font-medium text-gray-700">Wishlist</span></span>
            {wishlistCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">{wishlistCount}</span>}
          </Link>
          <Link href="/cart" prefetch={false} onClick={closeMenus} className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-green-50">
            <span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50"><ShoppingCart size={18} className="text-green-600" aria-hidden="true" /></span><span className="font-medium text-gray-700">Cart</span></span>
            {cartCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1.5 text-xs font-bold text-white">{cartCount}</span>}
          </Link>
        </div>

        <div className="mx-4 border-t border-gray-100" />

        <div className="p-4">
          {userName ? (
            <div className="space-y-3">
              <Link href="/profile" onClick={closeMenus} className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-center font-semibold text-white transition-colors hover:bg-green-700"><User size={17} aria-hidden="true" />{userName}</Link>
              <button type="button" onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"><LogOut size={17} aria-hidden="true" />Sign Out</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link href="/login" onClick={closeMenus} className="rounded-xl bg-green-600 py-3 text-center font-semibold text-white transition-colors hover:bg-green-700">Sign In</Link>
              <Link href="/register" onClick={closeMenus} className="rounded-xl border-2 border-green-600 py-3 text-center font-semibold text-green-600 transition-colors hover:bg-green-50">Sign Up</Link>
            </div>
          )}
        </div>

        <Link href="/support" onClick={closeMenus} className="mx-4 mt-2 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-green-50">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600"><Headphones size={20} aria-hidden="true" /></span>
          <span><span className="block text-sm font-semibold text-gray-700">Need Help?</span><span className="block text-sm text-green-600">Contact Support</span></span>
        </Link>
        <div className="h-6" />
      </aside>
    </>
  );
}
