import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderOpen, MoveLeft, MoveRight } from "lucide-react";
import { getCategoryById, getSubcategories } from "@/lib/store-api";

export default async function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  const [category, subcategories] = await Promise.all([getCategoryById(categoryId), getSubcategories(categoryId)]);
  if (!category) notFound();

  return <main className="min-h-screen bg-gray-50/50">
    <header className="bg-linear-to-br from-primary-600 via-primary-500 to-primary-400 text-white">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/70" aria-label="Breadcrumb"><Link href="/" className="hover:text-white">Home</Link><span className="text-white/40">/</span><Link href="/categories" className="hover:text-white">Categories</Link><span className="text-white/40">/</span><span className="font-medium text-white">{category.name}</span></nav>
        <div className="flex items-center gap-5"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/20 shadow-xl ring-1 ring-white/30 backdrop-blur-sm">{category.image ? <img alt={category.name} src={category.image} className="h-12 w-12 object-contain" /> : <FolderOpen size={30} />}</div><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{category.name}</h1><p className="mt-1 text-white/80">Choose a subcategory to browse products</p></div></div>
      </div>
    </header>
    <section className="container mx-auto px-4 py-10">
      <Link href="/categories" className="mb-6 inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-primary-600"><MoveLeft size={17} /><span>Back to Categories</span></Link>
      {subcategories.length ? <><h2 className="mb-6 text-lg font-bold text-gray-900">{subcategories.length} Subcategories in {category.name}</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">{subcategories.map((subcategory) => <Link key={subcategory.id} href={`/products?category=${category.id}&subcategory=${subcategory.id}`} className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100"><FolderOpen size={26} /></div><h3 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-primary-600">{subcategory.name}</h3><div className="flex items-center gap-2 text-sm text-primary-600 opacity-0 transition-opacity group-hover:opacity-100"><span>Browse Products</span><MoveRight size={14} /></div></Link>)}</div></> : <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xs"><p className="mb-4 text-gray-600">Browse all products in {category.name}.</p><Link className="inline-flex rounded-full bg-primary-600 px-5 py-2.5 font-semibold text-white hover:bg-primary-700" href={`/products?category=${category.id}`}>View Products</Link></div>}
    </section>
  </main>;
}
