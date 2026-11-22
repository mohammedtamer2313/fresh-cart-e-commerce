"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, ShoppingCart } from "lucide-react";
import { AUTH_STATE_CHANGE_EVENT } from "@/lib/auth-state";
import { getSession } from "@/lib/session";
import type { StoreCategory } from "@/lib/store-api";

const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");

function SocialLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a href={href} aria-label={label} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-white transition hover:bg-green-600">
      {children}
    </a>
  );
}

export default function Footer({ categories = [] }: { categories?: StoreCategory[] }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  useEffect(() => {
    const syncAuthState = () => setIsSignedIn(Boolean(getSession()?.token));
    syncAuthState();
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);
  const categoryHref = (name: string) => {
    const match = categories.find((category) => normalizeName(category.name) === normalizeName(name));
    return match ? `/categories/${match.id}` : "/categories";
  };
  const columns = [
    { title: "Shop", links: [["All Products", "/products"], ["Categories", "/categories"], ["Brands", "/brands"], ["Electronics", categoryHref("Electronics")], ["Men's Fashion", categoryHref("Men's Fashion")], ["Women's Fashion", categoryHref("Women's Fashion")]] },
    { title: "Account", links: [["My Account", "/profile"], ["Order History", "/orders"], ["Wishlist", "/wishlist"], ["Shopping Cart", "/cart"], ...(!isSignedIn ? [["Sign In", "/login"], ["Create Account", "/signup"]] as const : [])] },
    { title: "Support", links: [["Contact Us", "/support#contact"], ["Help Center", "/support#help"], ["Shipping Info", "/support#help"], ["Returns & Refunds", "/support#help"], ["Track Order", "/orders#tracking"]] },
    { title: "Legal", links: [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Cookie Policy", "/cookies"]] },
  ] as const;
  return (
    <footer className="mt-auto bg-[#0B1120] text-gray-300">
      <div className="border-y border-primary-100 bg-primary-50">
        <div className="container mx-auto px-4 py-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                <svg data-prefix="fas" data-icon="truck" className="svg-inline--fa fa-truck text-lg text-primary-600" role="img" viewBox="0 0 576 512" aria-hidden="true">
                  <path fill="currentColor" d="M0 96C0 60.7 28.7 32 64 32l288 0c35.3 0 64 28.7 64 64l0 32 50.7 0c17 0 33.3 6.7 45.3 18.7L557.3 192c12 12 18.7 28.3 18.7 45.3L576 384c0 35.3-28.7 64-64 64l-3.3 0c-10.4 36.9-44.4 64-84.7 64s-74.2-27.1-84.7-64l-102.6 0c-10.4 36.9-44.4 64-84.7 64s-74.2-27.1-84.7-64L64 448c-35.3 0-64-28.7-64-64L0 96zM512 288l0-50.7-45.3-45.3-50.7 0 0 96 96 0zM192 424a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm232 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
                </svg>
              </div>
              <div><h4 className="text-sm font-semibold text-gray-900">Free Shipping</h4><p className="text-xs text-gray-500">On orders over 500 EGP</p></div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                <svg data-prefix="fas" data-icon="arrow-rotate-left" className="svg-inline--fa fa-arrow-rotate-left text-lg text-primary-600" role="img" viewBox="0 0 512 512" aria-hidden="true">
                  <path fill="currentColor" d="M256 64c-56.8 0-107.9 24.7-143.1 64l47.1 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 192c-17.7 0-32-14.3-32-32L0 32C0 14.3 14.3 0 32 0S64 14.3 64 32l0 54.7C110.9 33.6 179.5 0 256 0 397.4 0 512 114.6 512 256S397.4 512 256 512c-87 0-163.9-43.4-210.1-109.7-10.1-14.5-6.6-34.4 7.9-44.6s34.4-6.6 44.6 7.9c34.8 49.8 92.4 82.3 157.6 82.3 106 0 192-86 192-192S362 64 256 64z" />
                </svg>
              </div>
              <div><h4 className="text-sm font-semibold text-gray-900">Easy Returns</h4><p className="text-xs text-gray-500">14-day return policy</p></div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                <svg data-prefix="fas" data-icon="shield-halved" className="svg-inline--fa fa-shield-halved text-lg text-primary-600" role="img" viewBox="0 0 512 512" aria-hidden="true">
                  <path fill="currentColor" d="M256 0c4.6 0 9.2 1 13.4 2.9L457.8 82.8c22 9.3 38.4 31 38.3 57.2-.5 99.2-41.3 280.7-213.6 363.2-16.7 8-36.1 8-52.8 0-172.4-82.5-213.1-264-213.6-363.2-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.9 1 251.4 0 256 0zm0 66.8l0 378.1c138-66.8 175.1-214.8 176-303.4l-176-74.6 0 0z" />
                </svg>
              </div>
              <div><h4 className="text-sm font-semibold text-gray-900">Secure Payment</h4><p className="text-xs text-gray-500">100% secure checkout</p></div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                <svg data-prefix="fas" data-icon="headset" className="svg-inline--fa fa-headset text-lg text-primary-600" role="img" viewBox="0 0 448 512" aria-hidden="true">
                  <path fill="currentColor" d="M224 64c-79 0-144.7 57.3-157.7 132.7 9.3-3 19.3-4.7 29.7-4.7l16 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-16 0c-53 0-96-43-96-96l0-64C0 100.3 100.3 0 224 0S448 100.3 448 224l0 168.1c0 66.3-53.8 120-120.1 120l-87.9-.1-32 0c-26.5 0-48-21.5-48-48s21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 0 40 0c39.8 0 72-32.2 72-72l0-20.9c-14.1 8.2-30.5 12.8-48 12.8l-16 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48l16 0c10.4 0 20.3 1.6 29.7 4.7-13-75.3-78.6-132.7-157.7-132.7z" />
                </svg>
              </div>
              <div><h4 className="text-sm font-semibold text-gray-900">24/7 Support</h4><p className="text-xs text-gray-500">Contact us anytime</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12 lg:gap-12">
          <section className="min-w-0 md:col-span-4">
            <Link href="/" aria-label="FreshCart home" className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xl font-bold tracking-tight text-gray-900">
              <ShoppingCart size={24} strokeWidth={2.2} className="text-[#0aad0a]" aria-hidden="true" />
              FreshCart
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              FreshCart is your one-stop destination for quality products. From fashion to electronics, we bring you the best brands at competitive prices with a seamless shopping experience.
            </p>
            <address className="mb-6 space-y-3 not-italic">
              <a href="tel:+201015815442" className="flex items-center gap-3 text-sm text-gray-400 transition-colors hover:text-white"><Phone size={16} className="shrink-0 text-[#0aad0a]" aria-hidden="true" /><span>+201015815442</span></a>
              <a href="mailto:mohammedtamer2313@gmail.com" className="flex items-center gap-3 text-sm text-gray-400 transition-colors hover:text-white"><Mail size={16} className="shrink-0 text-[#0aad0a]" aria-hidden="true" /><span>mohammedtamer2313@gmail.com</span></a>
              <p className="flex items-start gap-3 text-sm text-gray-400"><MapPin size={16} className="mt-0.5 shrink-0 text-[#0aad0a]" aria-hidden="true" /><span>123 Commerce Street, New York, NY 10001</span></p>
            </address>
            <div className="flex items-center gap-3">
              <SocialLink label="Facebook" href="https://www.facebook.com/">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5v3.1h2.8V21h3.2Z" /></svg>
              </SocialLink>
              <SocialLink label="Twitter / X" href="https://x.com/">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-6.3L6.6 22H3.4l7.3-8.4L2.9 2h6.2l4.3 5.8L18.9 2Zm-1.1 18h1.7L8.1 3.9H6.3L17.8 20Z" /></svg>
              </SocialLink>
              <SocialLink label="Instagram" href="https://www.instagram.com/">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></svg>
              </SocialLink>
              <SocialLink label="YouTube" href="https://www.youtube.com/">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15.5v-7l6 3.5-6 3.5Z" /></svg>
              </SocialLink>
            </div>
          </section>

          {columns.map((column) => (
            <section key={column.title} className="md:col-span-2">
              <h2 className="mb-5 text-lg font-semibold text-white">{column.title}</h2>
              <ul className="space-y-3">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-400 transition-colors hover:text-[#0aad0a]">{label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container mx-auto flex w-full flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
          <p className="text-center text-sm text-gray-500 md:text-left">{"\u00A9"} 2026 FreshCart. All rights reserved.</p>
          <div className="flex items-center justify-end gap-3" aria-label="Payment partners">
            <span className="flex h-9 items-center rounded-md bg-white px-3 text-sm font-extrabold italic tracking-tight text-[#1a1f71]">VISA</span>
            <span className="flex h-9 items-center gap-2 rounded-md bg-white px-3 text-xs font-semibold text-gray-800"><span className="flex"><span className="h-4 w-4 rounded-full bg-[#eb001b]" /><span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b]" /></span>mastercard</span>
            <span className="flex h-9 items-center rounded-md bg-white px-3 text-sm font-bold tracking-tight"><span className="text-[#003087]">Pay</span><span className="text-[#009cde]">Pal</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
