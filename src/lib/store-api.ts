const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");

export interface StoreCategory {
  id: string;
  name: string;
  image: string;
}

export interface StoreBrand {
  id: string;
  name: string;
  image: string;
}

export interface StoreSubcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface StoreProduct {
  id: string;
  title: string;
  image: string;
  category: string;
  price: number;
  priceAfterDiscount?: number;
  rating: number;
  ratingsCount: number;
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function entries(value: unknown): unknown[] {
  const root = record(value);
  if (!root) return [];
  if (Array.isArray(root.data)) return root.data;
  if (Array.isArray(root.results)) return root.results;
  const data = record(root.data);
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

async function getJson(path: string): Promise<unknown> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    return await response.json() as unknown;
  } catch {
    return null;
  }
}

function normalizeProducts(value: unknown): StoreProduct[] {
  return entries(value).flatMap((item) => {
    const product = record(item);
    const id = product?._id ?? product?.id;
    if (!product || typeof id !== "string" || typeof product.title !== "string") return [];
    const category = record(product.category);
    return [{
      id,
      title: product.title,
      image: typeof product.imageCover === "string" ? product.imageCover : "",
      category: typeof category?.name === "string" ? category.name : "Featured",
      price: typeof product.price === "number" ? product.price : 0,
      priceAfterDiscount: typeof product.priceAfterDiscount === "number" ? product.priceAfterDiscount : undefined,
      rating: typeof product.ratingsAverage === "number" ? product.ratingsAverage : 0,
      ratingsCount: typeof product.ratingsQuantity === "number" ? product.ratingsQuantity : 0,
    }];
  });
}

export async function getAllCategories(): Promise<StoreCategory[]> {
  const response = await getJson("/categories");
  return entries(response).flatMap((item) => {
    const value = record(item);
    const id = value?._id ?? value?.id;
    if (!value || typeof id !== "string" || typeof value.name !== "string") return [];
    return [{ id, name: value.name, image: typeof value.image === "string" ? value.image : "" }];
  });
}

export async function getAllBrands(): Promise<StoreBrand[]> {
  const response = await getJson("/brands");
  return entries(response).flatMap((item) => {
    const value = record(item);
    const id = value?._id ?? value?.id;
    if (!value || typeof id !== "string" || typeof value.name !== "string") return [];
    return [{ id, name: value.name, image: typeof value.image === "string" ? value.image : "" }];
  });
}

export async function getBrandById(id: string): Promise<StoreBrand | undefined> {
  return (await getAllBrands()).find((brand) => brand.id === id);
}

export async function getHomeCategories(): Promise<StoreCategory[]> {
  return (await getAllCategories()).slice(0, 10);
}

export async function getCategoryById(id: string): Promise<StoreCategory | undefined> {
  return (await getAllCategories()).find((category) => category.id === id);
}

export async function getSubcategories(categoryId: string): Promise<StoreSubcategory[]> {
  const response = await getJson(`/subcategories?category=${encodeURIComponent(categoryId)}`);
  return entries(response).flatMap((item) => {
    const value = record(item);
    const id = value?._id ?? value?.id;
    if (!value || typeof id !== "string" || typeof value.name !== "string") return [];
    const category = record(value.category);
    return [{ id, name: value.name, categoryId: typeof category?._id === "string" ? category._id : categoryId }];
  });
}

export async function getHomeProducts(): Promise<StoreProduct[]> {
  return normalizeProducts(await getJson("/products?limit=10"));
}

export async function getAllProducts(sort?: string, categoryId?: string, subcategoryId?: string, brandId?: string): Promise<StoreProduct[]> {
  const params = new URLSearchParams({ limit: "40" });
  if (sort === "newest") params.set("sort", "-createdAt");
  if (categoryId) params.set("category", categoryId);
  if (subcategoryId) params.set("subcategory", subcategoryId);
  if (brandId) params.set("brand", brandId);
  return normalizeProducts(await getJson(`/products?${params.toString()}`));
}

export type ProductSearchFilters = {
  query?: string;
  categories?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
};

export interface ProductSearchResult {
  products: StoreProduct[];
  totalResults: number;
  totalPages: number;
  page: number;
}

const SEARCH_PAGE_SIZE = 20;

function sortSearchProducts(products: StoreProduct[], sort?: string): StoreProduct[] {
  if (sort === "price") return products.sort((left, right) => left.price - right.price);
  if (sort === "-price") return products.sort((left, right) => right.price - left.price);
  if (sort === "-ratingsAverage") return products.sort((left, right) => right.rating - left.rating);
  if (sort === "title") return products.sort((left, right) => left.title.localeCompare(right.title));
  if (sort === "-title") return products.sort((left, right) => right.title.localeCompare(left.title));
  return products;
}

function searchMetadata(value: unknown): { totalResults?: number; totalPages?: number } {
  const root = record(value);
  const metadata = record(root?.metadata);
  const totalResults = typeof root?.results === "number" ? root.results : undefined;
  const totalPages = typeof metadata?.numberOfPages === "number"
    ? metadata.numberOfPages
    : typeof metadata?.totalPages === "number" ? metadata.totalPages : undefined;
  return { totalResults, totalPages };
}

export async function searchProducts(filters: ProductSearchFilters): Promise<ProductSearchResult> {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const params = new URLSearchParams({ limit: String(SEARCH_PAGE_SIZE), page: String(page) });
  if (filters.query?.trim()) params.set("keyword", filters.query.trim());
  if (filters.categories?.length) params.set("category[in]", filters.categories.join(","));
  if (filters.minPrice !== undefined) params.set("price[gte]", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("price[lte]", String(filters.maxPrice));
  if (["price", "-price", "-ratingsAverage", "title", "-title", "-createdAt"].includes(filters.sort ?? "")) {
    params.set("sort", filters.sort ?? "");
  }
  const brandIds = filters.brands ?? [];
  const responses = brandIds.length
    ? await Promise.all(brandIds.map((brandId) => {
      const brandParams = new URLSearchParams(params);
      brandParams.set("brand", brandId);
      // Fetch each selected brand's first result window, then combine and page the union.
      brandParams.set("page", "1");
      brandParams.set("limit", "100");
      return getJson(`/products?${brandParams.toString()}`);
    }))
    : [await getJson(`/products?${params.toString()}`)];
  const unique = new Map<string, StoreProduct>();
  responses.flatMap(normalizeProducts).forEach((product) => unique.set(product.id, product));
  const allProducts = sortSearchProducts([...unique.values()], filters.sort);
  const metadata = responses.map(searchMetadata);
  const totalResults = brandIds.length
    ? allProducts.length
    : metadata[0]?.totalResults ?? allProducts.length;
  const totalPages = brandIds.length
    ? Math.max(1, Math.ceil(totalResults / SEARCH_PAGE_SIZE))
    : metadata[0]?.totalPages ?? Math.max(1, Math.ceil(totalResults / SEARCH_PAGE_SIZE));
  const products = brandIds.length
    ? allProducts.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE)
    : allProducts;
  return { products, totalResults, totalPages, page };
}
