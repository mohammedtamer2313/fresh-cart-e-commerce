import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getAllBrands, getAllCategories, searchProducts, type ProductSearchFilters } from "@/lib/store-api";

type SearchParams = Record<string, string | string[] | undefined>;
const values = (value: string | string[] | undefined): string[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
const first = (value: string | string[] | undefined): string => values(value)[0] ?? "";

function makeSearchHref(params: SearchParams, overrides: Record<string, string | string[] | undefined> = {}): string {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (Array.isArray(value)) value.forEach((entry) => { if (entry) search.append(key, entry); });
    else if (value) search.set(key, value);
  }
  return `/search${search.size ? `?${search.toString()}` : ""}`;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = first(params.q).trim();
  const selectedCategories = values(params.category);
  const selectedBrands = values(params.brand);
  const minValue = first(params.minPrice);
  const maxValue = first(params.maxPrice);
  const minPrice = minValue && Number.isFinite(Number(minValue)) ? Math.max(0, Number(minValue)) : undefined;
  const maxPrice = maxValue && Number.isFinite(Number(maxValue)) ? Math.max(0, Number(maxValue)) : undefined;
  const sort = first(params.sort);
  const requestedPage = Number(first(params.page) || "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const filters: ProductSearchFilters = { query, categories: selectedCategories, brands: selectedBrands, minPrice, maxPrice, sort, page };
  const [searchResult, categories, brands] = await Promise.all([searchProducts(filters), getAllCategories(), getAllBrands()]);
  const { products, totalPages, totalResults } = searchResult;
  const currentPage = Math.min(page, totalPages);
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => firstPage + index);
  const pageSize = 20;
  const firstResult = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, totalResults);
  const safeQuery = query;

  return <main className="min-h-screen bg-gray-50/50">
    <header className="border-b border-gray-100 bg-white"><div className="container mx-auto px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-gray-500"><Link href="/" className="transition-colors hover:text-primary-600">Home</Link><span className="text-gray-300">/</span><span className="font-medium text-gray-900">Search Results</span></nav>
      <form action="/search" method="get" role="search" className="max-w-2xl"><div className="relative"><Search size={19} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input name="q" defaultValue={query} placeholder="Search for products..." aria-label="Search for products" className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-14 text-lg outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /><button type="submit" aria-label="Search" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700"><Search size={17} /></button></div></form>
    </div></header>

    <div className="container mx-auto px-4 py-8"><div className="flex gap-8">
      <aside className="hidden w-64 shrink-0 lg:block"><form action="/search" method="get" className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6">
        <input type="hidden" name="q" value={safeQuery} />
        {sort && <input type="hidden" name="sort" value={sort} />}
        <div className="space-y-6">
          <FilterGroup title="Categories">{categories.map((category) => <label key={category.id} className="group flex cursor-pointer items-center gap-3"><input type="checkbox" name="category" value={category.id} defaultChecked={selectedCategories.includes(category.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /><span className="text-sm text-gray-600 transition-colors group-hover:text-gray-900">{category.name}</span></label>)}</FilterGroup>
          <hr className="border-gray-100" />
          <section><h2 className="mb-4 font-bold text-gray-900">Price Range</h2><div className="mb-3 grid grid-cols-2 gap-3"><label className="text-xs text-gray-500">Min (EGP)<input name="minPrice" type="number" min="0" defaultValue={minValue} placeholder="0" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" /></label><label className="text-xs text-gray-500">Max (EGP)<input name="maxPrice" type="number" min="0" defaultValue={maxValue} placeholder="No limit" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" /></label></div><div className="flex flex-wrap gap-2">{[{ label: "Under 500", max: "500" }, { label: "Under 1K", max: "1000" }, { label: "Under 5K", max: "5000" }, { label: "Under 10K", max: "10000" }].map(({ label, max }) => <Link key={max} href={makeSearchHref(params, { maxPrice: max, page: "1" })} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-primary-100 hover:text-primary-700">{label}</Link>)}</div></section>
          <hr className="border-gray-100" />
          <FilterGroup title="Brands">{brands.map((brand) => <label key={brand.id} className="group flex cursor-pointer items-center gap-3"><input type="checkbox" name="brand" value={brand.id} defaultChecked={selectedBrands.includes(brand.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /><span className="text-sm text-gray-600 transition-colors group-hover:text-gray-900">{brand.name}</span></label>)}</FilterGroup>
          <button type="submit" className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700">Apply Filters</button>
          <Link href={makeSearchHref(params, { category: undefined, brand: undefined, minPrice: undefined, maxPrice: undefined, page: "1" })} className="block text-center text-sm text-gray-500 underline hover:text-gray-700">Clear filters</Link>
        </div>
      </form></aside>

      <section className="min-w-0 flex-1" aria-label="Search results">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><p className="text-sm text-gray-500">{query ? <>Results for <span className="font-semibold text-gray-900">“{query}”</span> · </> : null}Showing {firstResult}–{lastResult} of {totalResults} {totalResults === 1 ? "product" : "products"}</p></div>
          <form action="/search" method="get" className="flex items-center gap-2"><input type="hidden" name="q" value={query} />{selectedCategories.map((category) => <input key={category} type="hidden" name="category" value={category} />)}{selectedBrands.map((brand) => <input key={brand} type="hidden" name="brand" value={brand} />)}{minValue && <input type="hidden" name="minPrice" value={minValue} />}{maxValue && <input type="hidden" name="maxPrice" value={maxValue} />}<label htmlFor="search-sort" className="text-sm text-gray-500">Sort by:</label><select id="search-sort" name="sort" defaultValue={sort} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"><option value="">Relevance</option><option value="price">Price: Low to High</option><option value="-price">Price: High to Low</option><option value="-ratingsAverage">Rating: High to Low</option><option value="title">Name: A to Z</option><option value="-title">Name: Z to A</option></select><button type="submit" className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">Sort</button></form>
        </div>
        <details className="mb-5 rounded-xl border border-gray-100 bg-white p-4 lg:hidden"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-gray-800"><SlidersHorizontal size={16} className="text-primary-600" />Filters</summary><form action="/search" method="get" className="mt-4 space-y-5"><input type="hidden" name="q" value={query} />{sort && <input type="hidden" name="sort" value={sort} />}<FilterGroup title="Categories">{categories.map((category) => <label key={category.id} className="group flex cursor-pointer items-center gap-3"><input type="checkbox" name="category" value={category.id} defaultChecked={selectedCategories.includes(category.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /><span className="text-sm text-gray-600">{category.name}</span></label>)}</FilterGroup><FilterGroup title="Brands">{brands.map((brand) => <label key={brand.id} className="group flex cursor-pointer items-center gap-3"><input type="checkbox" name="brand" value={brand.id} defaultChecked={selectedBrands.includes(brand.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /><span className="text-sm text-gray-600">{brand.name}</span></label>)}</FilterGroup><div className="grid grid-cols-2 gap-3"><label className="text-xs text-gray-500">Min (EGP)<input name="minPrice" type="number" min="0" defaultValue={minValue} placeholder="0" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label><label className="text-xs text-gray-500">Max (EGP)<input name="maxPrice" type="number" min="0" defaultValue={maxValue} placeholder="No limit" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label></div><button type="submit" className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white">Apply Filters</button></form></details>
        {(selectedCategories.length > 0 || selectedBrands.length > 0 || minValue || maxValue) && <div className="mb-5 flex flex-wrap items-center gap-2">{selectedCategories.map((id) => <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1.5 text-xs font-medium text-primary-700">{categories.find((item) => item.id === id)?.name ?? "Category"}<Link aria-label="Remove category filter" href={makeSearchHref(params, { category: selectedCategories.filter((value) => value !== id) })}><X size={13} /></Link></span>)}{selectedBrands.map((id) => <span key={id} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700">{brands.find((item) => item.id === id)?.name ?? "Brand"}<Link aria-label="Remove brand filter" href={makeSearchHref(params, { brand: selectedBrands.filter((value) => value !== id) })}><X size={13} /></Link></span>)}{(minValue || maxValue) && <Link href={makeSearchHref(params, { minPrice: undefined, maxPrice: undefined })} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-700">Price: {minValue || "0"}–{maxValue || "∞"} EGP <X size={12} className="inline" /></Link>}</div>}
        {products.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center"><Search size={36} className="mx-auto mb-4 text-gray-300" /><h2 className="text-lg font-semibold text-gray-900">No products found</h2><p className="mt-2 text-sm text-gray-500">Try another search or adjust your filters.</p><Link href="/search" className="mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700">Clear search</Link></div>}
        {totalPages > 1 && <nav aria-label="Search results pages" className="mt-10 flex items-center justify-center gap-2">
          {currentPage > 1 ? <Link href={makeSearchHref(params, { page: String(currentPage - 1) })} aria-label="Previous page" className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"><ChevronLeft size={18} /></Link> : <span aria-disabled="true" className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 text-gray-300"><ChevronLeft size={18} /></span>}
          {pageNumbers.map((number) => number === currentPage
            ? <span key={number} aria-current="page" className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 font-medium text-white">{number}</span>
            : <Link key={number} href={makeSearchHref(params, { page: String(number) })} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 font-medium text-gray-600 transition-colors hover:bg-gray-50">{number}</Link>)}
          {currentPage < totalPages ? <Link href={makeSearchHref(params, { page: String(currentPage + 1) })} aria-label="Next page" className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"><ChevronRight size={18} /></Link> : <span aria-disabled="true" className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 text-gray-300"><ChevronRight size={18} /></span>}
        </nav>}
      </section>
    </div></div>
  </main>;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-4 font-bold text-gray-900">{title}</h2><div className="max-h-52 space-y-2 overflow-y-auto">{children}</div></section>;
}
