import Link from "next/link";
import { MoveRight, Tags } from "lucide-react";
import { getAllBrands } from "@/lib/store-api";

export default async function BrandsPage() {
  const brands = await getAllBrands();

  return <main className="min-h-screen bg-gray-50/50">
    <header className="bg-linear-to-br from-violet-600 via-violet-500 to-purple-400 text-white">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <nav className="mb-6 flex items-center gap-2 text-sm text-white/70" aria-label="Breadcrumb"><Link href="/" className="transition-colors hover:text-white">Home</Link><span className="text-white/40">/</span><span className="font-medium text-white">Brands</span></nav>
        <div className="flex items-center gap-5"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-xl ring-1 ring-white/30 backdrop-blur-sm"><Tags size={32} /></div><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Top Brands</h1><p className="mt-1 text-white/80">Shop from your favorite brands</p></div></div>
      </div>
    </header>
    <section className="container mx-auto px-4 py-10" aria-label="All brands">
      {brands.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-6">{brands.map((brand) => <Link key={brand.id} href={`/products?brand=${brand.id}`} className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl sm:p-5">
        <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gray-50 p-4">{brand.image ? <img alt={brand.name} src={brand.image} loading="lazy" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110" /> : <Tags size={38} className="text-violet-300" />}</div>
        <h2 className="truncate text-center text-sm font-semibold text-gray-900 transition-colors group-hover:text-violet-600">{brand.name}</h2>
        <div className="mt-1.5 flex justify-center text-violet-600 opacity-0 transition-opacity group-hover:opacity-100"><span className="flex items-center gap-1 text-xs">View Products<MoveRight size={11} /></span></div>
      </Link>)}</div> : <p className="rounded-xl bg-white p-8 text-center text-gray-500">Brands could not be loaded right now.</p>}
    </section>
  </main>;
}
