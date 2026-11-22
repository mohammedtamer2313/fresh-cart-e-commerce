import Link from "next/link";
import { Layers3, MoveRight } from "lucide-react";
import { getAllCategories } from "@/lib/store-api";

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return <main className="min-h-screen bg-gray-50/50">
    <header className="bg-linear-to-br from-primary-600 via-primary-500 to-primary-400 text-white">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <nav className="mb-6 flex items-center gap-2 text-sm text-white/70" aria-label="Breadcrumb"><Link href="/" className="transition-colors hover:text-white">Home</Link><span className="text-white/40">/</span><span className="font-medium text-white">Categories</span></nav>
        <div className="flex items-center gap-5"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-xl ring-1 ring-white/30 backdrop-blur-sm"><Layers3 size={32} /></div><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">All Categories</h1><p className="mt-1 text-white/80">Browse our wide range of product categories</p></div></div>
      </div>
    </header>
    <section className="container mx-auto px-4 py-10" aria-label="All categories">
      {categories.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">{categories.map((category) => <Link key={category.id} href={`/categories/${category.id}`} className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl sm:p-6">
        <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-gray-50">{category.image ? <img src={category.image} alt={category.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" /> : <div className="flex h-full items-center justify-center text-primary-300"><Layers3 size={42} /></div>}</div>
        <h2 className="text-center font-bold text-gray-900 transition-colors group-hover:text-primary-600">{category.name}</h2>
        <div className="mt-2 flex justify-center text-primary-600 opacity-0 transition-opacity group-hover:opacity-100"><span className="flex items-center gap-1 text-xs">Browse category<MoveRight size={12} /></span></div>
      </Link>)}</div> : <p className="rounded-xl bg-white p-8 text-center text-gray-500">Categories could not be loaded right now.</p>}
    </section>
  </main>;
}
