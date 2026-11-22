"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Heart, LoaderCircle, Minus, PackageCheck, Pencil, Plus, Share2, ShieldCheck, ShoppingCart, Star, Truck, RotateCcw, Box, MessageSquareText, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getSession } from "@/lib/session";
import { createProductReview, deleteReview, getProductReviews, updateReview, type ProductReview } from "@/lib/reviews-api";

type Product = {
  id: string;
  title: string;
  description: string;
  image: string;
  images: string[];
  price: number;
  oldPrice: number | null;
  rating: number;
  ratingsCount: number;
  quantity: number;
  category: string;
  categoryId: string;
  subcategory: string;
  brand: string;
  sold: number;
};
type RelatedProduct = { id: string; title: string; image: string; price: number; rating: number };
type DetailTab = "details" | "reviews" | "shipping";

const API_V1 = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");
const API_V2 = (process.env.NEXT_PUBLIC_API_V2_URL ?? "https://ecommerce.routemisr.com/api/v2").replace(/\/$/, "");
const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
const text = (value: unknown, fallback = ""): string => typeof value === "string" ? value : fallback;
const number = (value: unknown, fallback = 0): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;

function parseProduct(payload: unknown): Product | null {
  const root = record(payload);
  const raw = record(root.data);
  const item = record(raw.data ?? raw);
  const id = text(item._id ?? item.id);
  if (!id || !text(item.title)) return null;
  const category = record(item.category);
  const brand = record(item.brand);
  const images = Array.isArray(item.images) ? item.images.filter((image): image is string => typeof image === "string") : [];
  const image = text(item.imageCover, images[0] ?? "");
  const oldPrice = number(item.price);
  const discounted = number(item.priceAfterDiscount);
  const subcategories = Array.isArray(item.subcategory) ? item.subcategory : [];
  const subcategory = record(subcategories[0]);
  return {
    id, title: text(item.title), description: text(item.description), image,
    images: [...new Set([image, ...images].filter(Boolean))],
    price: discounted > 0 && discounted < oldPrice ? discounted : oldPrice,
    oldPrice: discounted > 0 && discounted < oldPrice ? oldPrice : null,
    rating: number(item.ratingsAverage), ratingsCount: number(item.ratingsQuantity),
    quantity: number(item.quantity), category: text(category.name, "Products"),
    categoryId: text(category._id ?? category.id), subcategory: text(subcategory.name),
    brand: text(brand.name), sold: number(item.sold),
  };
}

function parseRelated(payload: unknown, currentId: string): RelatedProduct[] {
  const root = record(payload);
  const items = Array.isArray(root.data) ? root.data : [];
  return items.flatMap((entry): RelatedProduct[] => {
    const item = record(entry);
    const id = text(item._id ?? item.id);
    if (!id || id === currentId) return [];
    const category = record(item.category);
    return [{ id, title: text(item.title, "Product"), image: text(item.imageCover), price: number(item.price), rating: number(item.ratingsAverage) }];
  });
}

export default function ProductDetailsPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const productId = params.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<DetailTab>("details");
  const [busy, setBusy] = useState<"cart" | "wishlist" | "buy" | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const priceTotal = useMemo(() => (product?.price ?? 0) * quantity, [product?.price, quantity]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void fetch(`${API_V1}/products/${encodeURIComponent(productId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load this product.");
        return await response.json() as unknown;
      })
      .then((payload) => {
        const loadedProduct = parseProduct(payload);
        if (!loadedProduct) throw new Error("This product could not be found.");
        setProduct(loadedProduct);
        setActiveImage(0);
        setQuantity(1);
        return fetch(`${API_V1}/products?limit=10&category=${encodeURIComponent(loadedProduct.categoryId)}`, { cache: "no-store", signal: controller.signal });
      })
      .then(async (response) => response?.ok ? await response.json() as unknown : null)
      .then((payload) => { if (payload) setRelated(parseRelated(payload, productId)); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load this product."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [productId]);

  useEffect(() => {
    const controller = new AbortController();
    setReviewsLoading(true);
    setReviewsError("");
    void getProductReviews(productId, controller.signal)
      .then(setReviews)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setReviewsError(reason instanceof Error ? reason.message : "Could not load reviews.");
      })
      .finally(() => { if (!controller.signal.aborted) setReviewsLoading(false); });
    return () => controller.abort();
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    const session = getSession();
    if (!session?.token) { setWishlisted(false); return; }
    void fetch(`${API_V1}/wishlist`, { headers: { token: session.token }, cache: "no-store" })
      .then(async (response) => response.ok ? await response.json() as unknown : null)
      .then((payload) => {
        const root = record(payload);
        const values = Array.isArray(root.data) ? root.data : [];
        setWishlisted(values.some((entry) => {
          const row = record(entry);
          const saved = record(row.product ?? row);
          return saved._id === product.id || saved.id === product.id;
        }));
      }).catch(() => undefined);
  }, [product]);

  async function addToCart(goToCheckout = false) {
    const session = getSession();
    if (!session?.token || !product) { toast.error("Please sign in to add products to your cart"); return; }
    const action = goToCheckout ? "buy" : "cart";
    setBusy(action);
    try {
      const response = await fetch(`${API_V2}/cart`, { method: "POST", headers: { "Content-Type": "application/json", token: session.token }, body: JSON.stringify({ productId: product.id, count: quantity }) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(text(record(payload).message, "Could not add this product to your cart."));
      window.dispatchEvent(new Event("freshcart-cart-change"));
      toast.success("Added to cart");
      if (goToCheckout) router.push("/checkout");
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Could not add this product to your cart."); }
    finally { setBusy(null); }
  }

  async function toggleWishlist() {
    const session = getSession();
    if (!session?.token || !product) { toast.error("Please sign in to save products"); return; }
    setBusy("wishlist");
    try {
      const response = await fetch(`${API_V1}/wishlist${wishlisted ? `/${encodeURIComponent(product.id)}` : ""}`, {
        method: wishlisted ? "DELETE" : "POST", headers: { "Content-Type": "application/json", token: session.token },
        ...(!wishlisted ? { body: JSON.stringify({ productId: product.id }) } : {}),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(text(record(payload).message, "Could not update your wishlist."));
      setWishlisted(!wishlisted);
      window.dispatchEvent(new Event("freshcart-wishlist-change"));
      toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Could not update your wishlist."); }
    finally { setBusy(null); }
  }

  async function shareProduct() {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product?.title, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); toast.success("Product link copied"); }
    } catch { /* Sharing was cancelled or the clipboard is unavailable. */ }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getSession();
    const token = session?.token || window.localStorage.getItem("userToken");
    if (!token) { toast.error("Please sign in to leave a review"); return; }
    if (!reviewRating) { toast.error("Choose a star rating first"); return; }
    setReviewBusy(true);
    setReviewsError("");
    try {
      const savedReview = editingReviewId
        ? await updateReview(editingReviewId, { title: reviewTitle.trim(), ratings: reviewRating }, token)
        : await createProductReview(productId, { review: reviewTitle.trim(), rating: reviewRating });
      if (savedReview) {
        setReviews((current) => editingReviewId
          ? current.map((review) => review.id === editingReviewId ? savedReview : review)
          : [savedReview, ...current.filter((review) => review.id !== savedReview.id)]);
      }
      setReviewTitle("");
      setReviewRating(0);
      setEditingReviewId(null);
      setReviewsError("");
      toast.success(editingReviewId ? "Review updated" : "Review submitted");
      // The write is authoritative. Refresh separately so a temporary GET
      // failure does not make a successful create look like it failed.
      void retryReviews();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not save your review.";
      setReviewsError(message);
      toast.error(message);
    } finally { setReviewBusy(false); }
  }

  function editReview(review: ProductReview) {
    setEditingReviewId(review.id);
    setReviewTitle(review.title);
    setReviewRating(review.ratings);
  }

  async function removeReview(reviewId: string) {
    const session = getSession();
    const token = session?.token || window.localStorage.getItem("userToken");
    if (!token) { toast.error("Please sign in to manage your review"); return; }
    setReviewBusy(true);
    try {
      await deleteReview(reviewId, token);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      if (editingReviewId === reviewId) { setEditingReviewId(null); setReviewTitle(""); setReviewRating(0); }
      toast.success("Review deleted");
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Could not delete your review."); }
    finally { setReviewBusy(false); }
  }

  async function retryReviews() {
    setReviewsLoading(true);
    setReviewsError("");
    try { setReviews(await getProductReviews(productId)); }
    catch (reason) { setReviewsError(reason instanceof Error ? reason.message : "Could not load reviews."); }
    finally { setReviewsLoading(false); }
  }

  if (loading) return <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4"><div role="status" className="flex items-center gap-3 text-gray-500"><LoaderCircle className="animate-spin text-primary-600" />Loading product details...</div></main>;
  if (error || !product) return <main className="container mx-auto px-4 py-20 text-center"><Box className="mx-auto mb-4 text-gray-300" size={44} /><h1 className="text-xl font-bold text-gray-900">Product unavailable</h1><p role="alert" className="mt-2 text-gray-500">{error || "This product could not be found."}</p><Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white"><ArrowLeft size={16} />Browse products</Link></main>;

  const selectedImage = product.images[activeImage] ?? product.image;
  const stock = product.quantity;
  const tabs: { id: DetailTab; label: string; Icon: typeof Box }[] = [
    { id: "details", label: "Product Details", Icon: Box },
    { id: "reviews", label: `Reviews (${reviews.length})`, Icon: Star },
    { id: "shipping", label: "Shipping & Returns", Icon: Truck },
  ];

  return <main className="min-h-screen bg-gray-50/40">
    <nav aria-label="Breadcrumb" className="py-4"><div className="container mx-auto flex flex-wrap items-center gap-2 px-4 text-sm"><Link href="/" className="text-gray-500 hover:text-primary-600">Home</Link><ChevronRight size={14} className="text-gray-400" />{product.categoryId ? <Link href={`/categories/${product.categoryId}`} className="text-gray-500 hover:text-primary-600">{product.category}</Link> : <Link href="/products" className="text-gray-500 hover:text-primary-600">{product.category}</Link>}{product.subcategory && <><ChevronRight size={14} className="text-gray-400" /><span className="text-gray-500">{product.subcategory}</span></>}<ChevronRight size={14} className="text-gray-400" /><span className="max-w-[55vw] truncate font-medium text-gray-900">{product.title}</span></div></nav>

    <section className="py-5"><div className="container mx-auto grid gap-6 px-4 lg:grid-cols-12">
      <aside className="lg:col-span-4"><div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex h-[360px] items-center justify-center rounded-xl bg-white p-3 sm:h-[440px]">{selectedImage ? <img src={selectedImage} alt={product.title} className="h-full w-full object-contain" /> : <Box size={64} className="text-gray-200" />}</div><div className="mt-4 flex gap-3 overflow-x-auto pb-1" aria-label="Product images">{product.images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setActiveImage(index)} aria-label={`Show product image ${index + 1}`} aria-pressed={activeImage === index} className={`h-16 w-16 shrink-0 rounded-xl border p-1.5 ${activeImage === index ? "border-primary-500 ring-2 ring-primary-100" : "border-gray-200 hover:border-primary-300"}`}><img src={image} alt="" className="h-full w-full object-contain" /></button>)}</div></div></aside>

      <section className="lg:col-span-8"><div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7"><div className="mb-4 flex flex-wrap gap-2">{product.categoryId && <Link href={`/categories/${product.categoryId}`} className="rounded-full bg-primary-50 px-3 py-1.5 text-xs text-primary-700 hover:bg-primary-100">{product.category}</Link>}{product.brand && <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-700">{product.brand}</span>}</div><h1 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">{product.title}</h1>
        <div className="mb-4 flex flex-wrap items-center gap-3"><span className="flex items-center gap-0.5 text-amber-400" aria-label={`${product.rating.toFixed(1)} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} fill={index < Math.round(product.rating) ? "currentColor" : "none"} />)}</span><button type="button" onClick={() => setTab("reviews")} className="text-sm text-gray-600 hover:text-primary-600">{product.rating.toFixed(1)} ({product.ratingsCount} reviews)</button></div>
        <div className="mb-5 flex flex-wrap items-center gap-3"><span className="text-3xl font-bold text-gray-900">{product.price.toLocaleString()} EGP</span>{product.oldPrice !== null && <><span className="text-gray-400 line-through">{product.oldPrice.toLocaleString()} EGP</span><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span></>}</div>
        <div className="mb-6"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${stock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}><span className={`h-2 w-2 rounded-full ${stock > 0 ? "bg-green-500" : "bg-red-500"}`} />{stock > 0 ? "In Stock" : "Out of Stock"}</span>{stock > 0 && <span className="ml-3 text-sm text-gray-500">{stock} available</span>}</div>
        <p className="mb-6 border-t border-gray-100 pt-5 leading-relaxed text-gray-600">{product.description || "Find out more about this product from its product information below."}</p>
        <div className="mb-6"><label htmlFor="product-quantity" className="mb-2 block text-sm font-medium text-gray-700">Quantity</label><div className="flex flex-wrap items-center gap-4"><div className="flex overflow-hidden rounded-lg border-2 border-gray-200"><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((count) => Math.max(1, count - 1))} className="px-4 py-3 text-gray-600 transition hover:bg-gray-100 hover:text-primary-600 disabled:opacity-40"><Minus size={16} /></button><input id="product-quantity" type="number" min={1} max={Math.max(1, stock)} value={quantity} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setQuantity(Math.max(1, Math.min(Math.max(1, stock), Math.floor(value)))); }} className="w-16 border-0 text-center text-lg font-medium focus:outline-none focus:ring-0" /><button type="button" aria-label="Increase quantity" disabled={quantity >= stock} onClick={() => setQuantity((count) => Math.min(stock, count + 1))} className="px-4 py-3 text-gray-600 transition hover:bg-gray-100 hover:text-primary-600 disabled:opacity-40"><Plus size={16} /></button></div><span className="text-sm text-gray-500">{stock} available</span></div></div>
        <div className="mb-6 flex items-center justify-between rounded-xl bg-gray-50 p-4"><span className="text-gray-600">Total Price</span><span className="text-2xl font-bold text-primary-600">{priceTotal.toFixed(2)} EGP</span></div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row"><button type="button" disabled={stock < 1 || busy !== null} onClick={() => void addToCart()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">{busy === "cart" ? <LoaderCircle size={18} className="animate-spin" /> : <ShoppingCart size={18} />}Add to Cart</button><button type="button" disabled={stock < 1 || busy !== null} onClick={() => void addToCart(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">{busy === "buy" ? <LoaderCircle size={18} className="animate-spin" /> : <PackageCheck size={18} />}Buy Now</button></div>
        <div className="mb-6 flex gap-3"><button type="button" disabled={busy !== null} onClick={() => void toggleWishlist()} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition ${wishlisted ? "border-red-200 bg-red-50 text-red-600" : "border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600"}`}>{busy === "wishlist" ? <LoaderCircle size={17} className="animate-spin" /> : <Heart size={17} fill={wishlisted ? "currentColor" : "none"} />}{wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}</button><button type="button" onClick={() => void shareProduct()} aria-label="Share product" className="rounded-xl border-2 border-gray-200 px-4 text-gray-700 transition hover:border-primary-300 hover:text-primary-600"><Share2 size={18} /></button></div>
        <div className="grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3"><Feature Icon={Truck} title="Free Delivery" description="Orders over 500 EGP" /><Feature Icon={RotateCcw} title="Easy Returns" description="14-day return policy" /><Feature Icon={ShieldCheck} title="Secure Payment" description="Protected checkout" /></div>
      </div></section>
    </div></section>

    <section className="py-8"><div className="container mx-auto px-4"><div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div role="tablist" aria-label="Product information" className="flex overflow-x-auto border-b border-gray-200">{tabs.map(({ id, label, Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-4 font-medium transition sm:px-6 ${tab === id ? "border-primary-600 bg-primary-50/50 text-primary-600" : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-primary-600"}`}><Icon size={16} />{label}</button>)}</div>
      <div role="tabpanel" className="p-5 sm:p-6">{tab === "details" ? <div className="space-y-6"><div><h2 className="mb-3 text-lg font-semibold text-gray-900">About this Product</h2><p className="whitespace-pre-line leading-relaxed text-gray-600">{product.description || "No additional description is available for this product."}</p></div><div className="grid gap-6 md:grid-cols-2"><InfoCard title="Product Information"><InfoRow label="Category" value={product.category} />{product.subcategory && <InfoRow label="Subcategory" value={product.subcategory} />}{product.brand && <InfoRow label="Brand" value={product.brand} />}<InfoRow label="Items Sold" value={`${product.sold.toLocaleString()} sold`} /><InfoRow label="Availability" value={stock > 0 ? `${stock} in stock` : "Out of stock"} /></InfoCard><InfoCard title="Key Features"><FeatureLine>Authentic product</FeatureLine><FeatureLine>Quality checked</FeatureLine><FeatureLine>Secure packaging</FeatureLine><FeatureLine>Customer support available</FeatureLine></InfoCard></div></div> : tab === "reviews" ? <ReviewsPanel product={product} reviews={reviews} loading={reviewsLoading} error={reviewsError} rating={reviewRating} title={reviewTitle} busy={reviewBusy} editingReviewId={editingReviewId} onRatingChange={setReviewRating} onTitleChange={setReviewTitle} onSubmit={submitReview} onEdit={editReview} onDelete={removeReview} onRetry={() => void retryReviews()} /> : <div className="space-y-6"><div className="grid grid-cols-1 gap-6 md:grid-cols-2"><ShippingCard Icon={Truck} title="Shipping Information" tone="primary"><FeatureLine>Free shipping on orders over 500 EGP</FeatureLine><FeatureLine>Standard delivery: 3–5 business days</FeatureLine><FeatureLine>Express delivery available in eligible areas</FeatureLine><FeatureLine>Track your order after checkout</FeatureLine></ShippingCard><ShippingCard Icon={RotateCcw} title="Returns & Refunds" tone="green"><FeatureLine>14-day hassle-free returns</FeatureLine><FeatureLine>Refund or exchange on eligible items</FeatureLine><FeatureLine>Free return shipping on defective items</FeatureLine><FeatureLine>Contact support to start a return</FeatureLine></ShippingCard></div><div className="flex items-center gap-4 rounded-xl bg-gray-50 p-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600"><ShieldCheck size={23} /></span><div><h3 className="mb-1 font-semibold text-gray-900">Buyer Protection Guarantee</h3><p className="text-sm leading-relaxed text-gray-600">Your order is protected through secure checkout and our customer support team.</p></div></div></div>}</div></div></div></section>

    {related.length > 0 && <section className="pb-12"><div className="container mx-auto px-4"><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2><Link href="/products" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">View all <ArrowRight size={15} /></Link></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{related.slice(0, 5).map((item) => <Link key={item.id} href={`/products/${item.id}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"><div className="h-40 bg-white p-3 sm:h-52">{item.image && <img src={item.image} alt={item.title} className="h-full w-full object-contain" />}</div><div className="p-3"><p className="line-clamp-2 min-h-10 text-sm font-medium text-gray-800">{item.title}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="font-bold text-gray-900">{item.price} EGP</span><span className="flex items-center gap-1 text-xs text-amber-500"><Star size={12} fill="currentColor" />{item.rating.toFixed(1)}</span></div></div></Link>)}</div></div></section>}
  </main>;
}

function Feature({ Icon, title, description }: { Icon: typeof Truck; title: string; description: string }) {
  return <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600"><Icon size={19} /></span><span><span className="block text-sm font-medium text-gray-900">{title}</span><span className="block text-xs text-gray-500">{description}</span></span></div>;
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl bg-gray-50 p-4"><h3 className="mb-3 font-medium text-gray-900">{title}</h3><div className="space-y-2">{children}</div></section>;
}

function ShippingCard({ Icon, title, tone, children }: { Icon: typeof Truck; title: string; tone: "primary" | "green"; children: ReactNode }) {
  const colorClasses = tone === "primary" ? "from-primary-50 to-primary-100 bg-primary-600" : "from-green-50 to-green-100 bg-green-600";
  return <section className={`rounded-xl bg-gradient-to-br p-6 ${colorClasses.split(" ").slice(0, 2).join(" ")}`}><div className="mb-4 flex items-center gap-3"><span className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${colorClasses.split(" ")[2]}`}><Icon size={22} /></span><h3 className="font-semibold text-gray-900">{title}</h3></div><div className="space-y-3">{children}</div></section>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 text-sm"><span className="text-gray-500">{label}</span><span className="text-right font-medium text-gray-900">{value}</span></div>;
}

function FeatureLine({ children }: { children: ReactNode }) {
  return <p className="flex items-start gap-2 text-sm text-gray-600"><Check size={15} className="mt-0.5 shrink-0 text-primary-600" />{children}</p>;
}

function Stars({ rating }: { rating: number }) {
  return <span className="inline-flex text-amber-400">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} fill={index < Math.round(rating) ? "currentColor" : "none"} />)}</span>;
}

type ReviewsPanelProps = {
  product: Product;
  reviews: ProductReview[];
  loading: boolean;
  error: string;
  rating: number;
  title: string;
  busy: boolean;
  editingReviewId: string | null;
  onRatingChange: (rating: number) => void;
  onTitleChange: (title: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEdit: (review: ProductReview) => void;
  onDelete: (reviewId: string) => void;
  onRetry: () => void;
};

function ReviewsPanel({ product, reviews, loading, error, rating, title, busy, editingReviewId, onRatingChange, onTitleChange, onSubmit, onEdit, onDelete, onRetry }: ReviewsPanelProps) {
  const userId = getSession()?.user.id;
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.ratings, 0) / reviews.length : 0;
  const count = reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map((value) => reviews.filter((review) => Math.min(5, Math.max(1, Math.round(review.ratings))) === value).length);

  return <div className="space-y-6">
    <div className="flex flex-col items-start gap-8 rounded-xl bg-gray-50 p-5 md:flex-row md:items-center">
      <div className="min-w-32 text-center"><div className="mb-2 text-5xl font-bold text-gray-900">{average.toFixed(1)}<span className="text-xl text-gray-400"> / 5</span></div><Stars rating={average} /><p className="mt-2 text-sm text-gray-500">Based on {count} {count === 1 ? "review" : "reviews"}</p></div>
      <div className="w-full flex-1">{[5, 4, 3, 2, 1].map((value, index) => {
        const percent = reviews.length ? Math.round((ratingCounts[index] / reviews.length) * 100) : 0;
        return <div key={value} className="mb-2 flex items-center gap-3"><span className="w-10 text-sm text-gray-600">{value} star</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-label={`${value} star reviews`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div className="h-full rounded-full bg-yellow-400 transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} /></div><span className="w-10 text-right text-sm text-gray-500">{percent}%</span></div>;
      })}</div>
    </div>

    <section aria-label="Customer reviews" className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>{!loading && <span className="text-sm text-gray-500">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>}</div>
      {loading && <div role="status" className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 p-8 text-sm text-gray-500"><LoaderCircle size={18} className="animate-spin text-primary-600" />Loading reviews...</div>}
      {!loading && error && <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"><p role="alert">{error}</p><button type="button" onClick={onRetry} className="mt-3 font-semibold underline">Try again</button></div>}
      {!loading && !error && reviews.length === 0 && <div className="rounded-xl border border-gray-100 py-8 text-center"><MessageSquareText size={34} className="mx-auto mb-3 text-gray-300" /><p className="text-gray-500">No customer reviews yet. Be the first to share your experience.</p></div>}
      {!loading && reviews.map((review) => <article key={review.id} className="rounded-xl border border-gray-100 bg-white p-5"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">{review.userName.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate font-semibold text-gray-900">{review.userName}</p><p className="text-xs text-gray-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</p></div></div><Stars rating={review.ratings} /></div><p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-700">{review.title}</p>{userId && review.userId === userId && <div className="mt-4 flex gap-3 border-t border-gray-100 pt-3"><button type="button" onClick={() => onEdit(review)} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"><Pencil size={14} />Edit</button><button type="button" disabled={busy} onClick={() => onDelete(review.id)} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"><Trash2 size={14} />Delete</button></div>}</article>)}
    </section>

    <form onSubmit={onSubmit} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
      <h3 className="mb-4 font-semibold text-gray-900">{editingReviewId ? "Edit your review" : "Write a Review"}</h3>
      <fieldset className="mb-4"><legend className="mb-2 text-sm font-medium text-gray-700">Your rating</legend><div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value} onClick={() => onRatingChange(value)} className="rounded p-1 text-yellow-400 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"><Star size={24} fill={value <= rating ? "currentColor" : "none"} /></button>)}</div></fieldset>
      <label htmlFor="review-title" className="mb-2 block text-sm font-medium text-gray-700">Your review</label><textarea id="review-title" value={title} onChange={(event) => onTitleChange(event.target.value)} required minLength={3} maxLength={500} rows={3} placeholder="Tell others what you think about this product..." className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
      <button type="submit" disabled={busy || !rating} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">{busy && <LoaderCircle size={16} className="animate-spin" />}{editingReviewId ? "Update Review" : "Submit Review"}</button>
    </form>
  </div>;
}
