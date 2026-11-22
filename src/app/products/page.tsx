import Link from "next/link";
import { PackageOpen, Tags, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getAllBrands, getAllCategories, getAllProducts, getSubcategories } from "@/lib/store-api";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ sort?: string; category?: string; subcategory?: string; brand?: string }> }) {
  const { sort, category: categoryId, subcategory: subcategoryId, brand: brandId } = await searchParams;
  const [products, categories, subcategories, brands] = await Promise.all([
    getAllProducts(sort, categoryId, subcategoryId, brandId),
    getAllCategories(),
    categoryId ? getSubcategories(categoryId) : Promise.resolve([]),
    getAllBrands(),
  ]);
  const category = categories.find((item) => item.id === categoryId);
  const subcategory = subcategories.find((item) => item.id === subcategoryId);
  const brand = brands.find((item) => item.id === brandId);
  const sortParams = new URLSearchParams();
  if (sort !== "newest") sortParams.set("sort", "newest");
  if (categoryId) sortParams.set("category", categoryId);
  if (subcategoryId) sortParams.set("subcategory", subcategoryId);
  if (brandId) sortParams.set("brand", brandId);
  const sortHref = `/products${sortParams.size ? `?${sortParams.toString()}` : ""}`;

  return <main className="min-h-screen bg-gray-50/50">
    <header className="bg-linear-to-br from-primary-600 via-primary-500 to-primary-400 text-white">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/70" aria-label="Breadcrumb"><Link href="/" className="transition-colors hover:text-white">Home</Link><span className="text-white/40">/</span>{brand ? <><Link href="/brands" className="hover:text-white">Brands</Link><span className="text-white/40">/</span><span className="font-medium text-white">{brand.name}</span></> : category ? <><Link href="/categories" className="hover:text-white">Categories</Link><span className="text-white/40">/</span><Link href={`/categories/${category.id}`} className="hover:text-white">{category.name}</Link><span className="text-white/40">/</span><span className="font-medium text-white">{subcategory?.name ?? category.name}</span></> : <span className="font-medium text-white">All Products</span>}</nav>
        <div className="flex items-center gap-5"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-xl ring-1 ring-white/30 backdrop-blur-sm">{brand ? <Tags size={32} /> : <PackageOpen size={32} />}</div><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{brand?.name ?? subcategory?.name ?? category?.name ?? "All Products"}</h1><p className="mt-1 text-white/80">{brand ? `Shop ${brand.name} products` : category ? `Browse products in ${subcategory?.name ?? category.name}` : "Explore our complete product collection"}</p></div></div>
      </div>
    </header>
    <section className="container mx-auto px-4 py-8" aria-label="Product catalog">
      {(category || subcategory || brand) && <div className="mb-6 flex flex-wrap items-center gap-3"><span className="text-sm text-gray-600">Active Filters:</span>{brand && <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-200"><Tags size={13} />{brand.name}<X size={13} /></Link>}{category && <Link href={subcategoryId ? `/products?subcategory=${subcategoryId}${brandId ? `&brand=${brandId}` : ""}` : brandId ? `/products?brand=${brandId}` : "/products"} className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:bg-primary-200">{category.name}<X size={13} /></Link>}{subcategory && <Link href={categoryId ? `/products?category=${categoryId}${brandId ? `&brand=${brandId}` : ""}` : "/products"} className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:bg-primary-200">{subcategory.name}<X size={13} /></Link>}<Link href="/products" className="text-sm text-gray-500 underline hover:text-gray-700">Clear all</Link></div>}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500"><span>Showing {products.length} products</span><Link href={sortHref} className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-medium text-gray-600 transition hover:border-primary-500 hover:text-primary-600">{sort === "newest" ? "Newest first" : "Sort: Featured"}</Link></div>
      {products.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-500">Products could not be loaded right now. Please refresh to try again.</div>}
    </section>
  </main>;
}
