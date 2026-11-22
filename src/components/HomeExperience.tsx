"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Leaf,
  Mail,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { StoreCategory, StoreProduct } from "@/lib/store-api";

const slides = [
  {
    title: "Fresh Products Delivered to your Door",
    description: "Get 20% off your first order",
    primary: "Shop Now",
    secondary: "View Deals",
    href: "/products",
    secondaryHref: "/products",
  },
  {
    title: "Premium Quality Guaranteed",
    description: "Fresh from farm to your table",
    primary: "Shop Now",
    secondary: "Learn More",
    href: "/products",
    secondaryHref: "/about",
  },
  {
    title: "Fast & Free Delivery",
    description: "Same day delivery available",
    primary: "Order Now",
    secondary: "Delivery Info",
    href: "/products",
    secondaryHref: "/delivery",
  },
];

const benefits = [
  { title: "Free Shipping", description: "On orders over 500 EGP", Icon: Truck, color: "text-blue-500 bg-blue-50" },
  { title: "Secure Payment", description: "100% secure transactions", Icon: ShieldCheck, color: "text-emerald-500 bg-emerald-50" },
  { title: "Easy Returns", description: "14-day return policy", Icon: RotateCcw, color: "text-orange-500 bg-orange-50" },
  { title: "24/7 Support", description: "Dedicated support team", Icon: Headphones, color: "text-purple-500 bg-purple-50" },
];

type Props = { categories: StoreCategory[]; products: StoreProduct[] };

export default function HomeExperience({ categories, products }: Props) {
  const [slide, setSlide] = useState(0);
  const [email, setEmail] = useState("");

  function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    toast.success("Thanks for subscribing!");
    setEmail("");
  }

  return (
    <main>
      <section className="relative h-100 overflow-hidden">
        <div className="flex h-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {slides.map((item) => <div key={item.title} className="relative h-full w-full shrink-0 bg-cover bg-center" style={{ backgroundImage: "url('/home-slider-1.d79601a8.png')" }}>
            <div className="absolute inset-0 bg-linear-to-r from-green-600/90 to-green-500/50" />
            <div className="container relative mx-auto flex h-full items-center px-4 text-white">
              <div className="max-w-lg">
                <h1 className="mb-4 max-w-96 text-3xl font-bold leading-tight text-white md:text-4xl">{item.title}</h1>
                <p className="text-lg text-white/90">{item.description}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={item.href} className="rounded-lg border-2 border-white/50 bg-white px-6 py-2.5 font-semibold text-green-600 transition hover:scale-105">{item.primary}</Link>
                  <Link href={item.secondaryHref} className="rounded-lg border-2 border-white/50 px-6 py-2.5 font-semibold text-white transition hover:bg-white/10">{item.secondary}</Link>
                </div>
              </div>
            </div>
          </div>)}
        </div>
        <button type="button" aria-label="Previous slide" onClick={() => setSlide((slide + slides.length - 1) % slides.length)} className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-green-600 shadow-lg transition hover:scale-110 md:flex"><ChevronLeft /></button>
        <button type="button" aria-label="Next slide" onClick={() => setSlide((slide + 1) % slides.length)} className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-green-600 shadow-lg transition hover:scale-110 md:flex"><ChevronRight /></button>
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2" aria-label="Choose slide">
          {slides.map((item, index) => <button key={item.title} type="button" onClick={() => setSlide(index)} aria-label={`Slide ${index + 1}`} className={`h-2.5 rounded-full transition-all ${index === slide ? "w-7 bg-white" : "w-2.5 bg-white/60"}`} />)}
        </div>
      </section>

      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ title, description, Icon, color }) => <div key={title} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-xs transition-shadow hover:shadow-md"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}><Icon size={22} /></div><div><h2 className="text-sm font-semibold text-gray-800">{title}</h2><p className="text-xs text-gray-500">{description}</p></div></div>)}
        </div></div>
      </section>

      <section id="categories" className="py-10">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col justify-between sm:flex-row sm:items-center">
            <div className="my-5 flex items-center gap-3"><div className="h-8 w-1.5 rounded-full bg-linear-to-b from-emerald-500 to-emerald-700" /><h2 className="text-2xl font-bold text-gray-800 md:text-3xl">Shop By <span className="text-emerald-600">Category</span></h2></div>
            <Link href="/categories" className="flex self-end items-center font-medium text-primary-600 transition hover:text-primary-700 sm:self-auto">View All Categories<ArrowRight size={16} className="ml-2" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 10).map((category) => <Link key={category.id} href={`/categories/${category.id}`} className="group cursor-pointer rounded-lg bg-white p-4 text-center shadow-xs transition hover:shadow-md">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-100 transition group-hover:bg-primary-200"><img src={category.image} alt={category.name} className="h-full w-full object-cover" loading="lazy" /></div><h3 className="font-medium text-gray-800">{category.name}</h3>
            </Link>)}
          </div>
        </div>
      </section>

      <section className="py-10"><div className="container mx-auto px-4"><div className="grid gap-6 md:grid-cols-2">
        <article className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-700 p-8 text-white"><div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" /><div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-white/10" /><div className="relative z-10"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm"><span>🔥</span>Deal of the Day</div><h2 className="mb-2 text-2xl font-bold md:text-3xl">Fresh Organic Fruits</h2><p className="mb-4 text-white/80">Get up to 40% off on selected organic fruits</p><div className="mb-6 flex flex-wrap items-center gap-4"><strong className="text-3xl">40% OFF</strong><span className="text-sm text-white/80">Use code: <b className="text-white">ORGANIC40</b></span></div><Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-emerald-600 transition hover:bg-gray-100">Shop Now<ArrowRight size={17} /></Link></div></article>
        <article className="relative overflow-hidden rounded-2xl bg-linear-to-br from-orange-400 to-rose-500 p-8 text-white"><div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" /><div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-white/10" /><div className="relative z-10"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm"><span>✨</span>New Arrivals</div><h2 className="mb-2 text-2xl font-bold md:text-3xl">Exotic Vegetables</h2><p className="mb-4 text-white/80">Discover our latest collection of premium vegetables</p><div className="mb-6 flex flex-wrap items-center gap-4"><strong className="text-3xl">25% OFF</strong><span className="text-sm text-white/80">Use code: <b className="text-white">FRESH25</b></span></div><Link href="/products?sort=newest" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-orange-500 transition hover:bg-gray-100">Explore Now<ArrowRight size={17} /></Link></div></article>
      </div></div></section>

      <section className="py-10"><div className="container mx-auto px-4">
        <div className="my-8 flex items-center gap-3"><div className="h-8 w-1.5 rounded-full bg-linear-to-b from-emerald-500 to-emerald-700" /><h2 className="text-3xl font-bold text-gray-800">Featured <span className="text-emerald-600">Products</span></h2></div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        <div className="mt-8 text-center"><Link href="/products" className="inline-flex items-center gap-2 rounded-full border border-primary-600 px-6 py-3 font-semibold text-primary-600 transition hover:bg-primary-600 hover:text-white">View All Products<ArrowRight size={17} /></Link></div>
      </div></section>

      <section className="px-4 py-12"><div className="container mx-auto overflow-hidden rounded-4xl bg-linear-to-br from-emerald-50 via-white to-green-100 px-6 py-10 md:px-12 lg:py-14"><div className="grid items-center gap-10 lg:grid-cols-2">
        <div><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Mail size={23} /></div><h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">Get the FreshCart Newsletter</h2><p className="mb-7 max-w-lg text-gray-600">Subscribe to receive updates on new arrivals, special offers and more.</p><form onSubmit={subscribe} className="flex max-w-xl flex-col gap-3 sm:flex-row"><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" className="min-w-0 flex-1 rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm outline-hidden transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /><button type="submit" className="rounded-full bg-emerald-600 px-7 py-3.5 font-semibold text-white transition hover:bg-emerald-700">Subscribe</button></form></div>
        <div className="relative overflow-hidden rounded-3xl bg-gray-900 p-7 text-white md:p-9"><div className="absolute -right-14 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-2xl" /><div className="relative"><span className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"><Leaf size={16} />FRESH CART APP</span><h3 className="mb-3 text-2xl font-bold">Shop Faster on Our App</h3><p className="mb-6 max-w-sm text-sm leading-6 text-gray-300">Get the best shopping experience with exclusive app-only deals.</p><div className="flex flex-wrap gap-3"><a href="#" className="rounded-lg border border-gray-600 bg-black px-4 py-2 text-sm font-semibold hover:border-white">Download on the App Store</a><a href="#" className="rounded-lg border border-gray-600 bg-black px-4 py-2 text-sm font-semibold hover:border-white">Get it on Google Play</a></div></div></div>
      </div></div></section>
    </main>
  );
}
