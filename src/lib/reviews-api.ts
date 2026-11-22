import { getSession } from "@/lib/session";

const API_V1 = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");

export type ProductReview = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  title: string;
  ratings: number;
  createdAt: string;
};

export type ReviewInput = { title: string; ratings: number };
export type CreateProductReviewInput = { review: string; rating: number };

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function normalizeReview(value: unknown): ProductReview | null {
  const item = record(value);
  const user = record(item.user);
  const product = record(item.product);
  const id = item._id ?? item.id;
  if (typeof id !== "string") return null;
  return {
    id,
    productId: typeof product._id === "string" ? product._id : typeof item.product === "string" ? item.product : "",
    userId: typeof user._id === "string" ? user._id : typeof user.id === "string" ? user.id : "",
    userName: typeof user.name === "string" ? user.name : typeof item.userName === "string" ? item.userName : "Customer",
    title: typeof item.review === "string" ? item.review : typeof item.title === "string" ? item.title : "",
    ratings: typeof item.rating === "number" ? item.rating : typeof item.ratings === "number" ? item.ratings : 0,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
  };
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${API_V1}${path}`, { cache: "no-store", ...init });
  let payload: unknown;
  try { payload = await response.json() as unknown; } catch { payload = null; }
  if (!response.ok) {
    const body = record(payload);
    const errors = record(body.errors);
    const message = body.message ?? body.error ?? errors.message;
    throw new Error(typeof message === "string" ? message : "The reviews request failed. Please try again.");
  }
  return payload;
}

function listFrom(payload: unknown): ProductReview[] {
  const root = record(payload);
  const data = root.data;
  const nested = record(data);
  const rows = Array.isArray(payload) ? payload : Array.isArray(data) ? data : Array.isArray(nested.data) ? nested.data : Array.isArray(nested.reviews) ? nested.reviews : [];
  return rows.flatMap((row): ProductReview[] => {
    const review = normalizeReview(row);
    return review ? [review] : [];
  });
}

function singleFrom(payload: unknown): ProductReview | null {
  const root = record(payload);
  const data = record(root.data);
  return normalizeReview(data.review ?? data.data ?? root.review ?? root.data);
}

export async function getProductReviews(productId: string, signal?: AbortSignal): Promise<ProductReview[]> {
  return listFrom(await request(`/products/${encodeURIComponent(productId)}/reviews`, { signal }));
}

export async function createProductReview(productId: string, input: CreateProductReviewInput): Promise<ProductReview | null> {
  const review = input.review.trim();
  if (review.length < 3) throw new Error("Write at least 3 characters for your review.");
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new Error("Choose a rating from 1 to 5 stars.");
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("userToken") || getSession()?.token || null;
  if (!token) throw new Error("Please sign in to leave a review.");
  if (typeof window !== "undefined" && !window.localStorage.getItem("userToken")) {
    window.localStorage.setItem("userToken", token);
  }
  const storedToken = typeof window === "undefined" ? null : window.localStorage.getItem("userToken");
  if (!storedToken) throw new Error("Your sign-in session expired. Please sign in again.");
  return singleFrom(await request(`/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST", headers: { token: storedToken, "Content-Type": "application/json" }, body: JSON.stringify({ review, rating: input.rating }),
  }));
}

export async function getAllReviews(signal?: AbortSignal): Promise<ProductReview[]> {
  return listFrom(await request("/reviews", { signal }));
}

export async function getReviewById(reviewId: string, signal?: AbortSignal): Promise<ProductReview | null> {
  return singleFrom(await request(`/reviews/${encodeURIComponent(reviewId)}`, { signal }));
}

export async function updateReview(reviewId: string, input: ReviewInput, token: string): Promise<ProductReview | null> {
  return singleFrom(await request(`/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PUT", headers: { "Content-Type": "application/json", token }, body: JSON.stringify(input),
  }));
}

export async function deleteReview(reviewId: string, token: string): Promise<void> {
  await request(`/reviews/${encodeURIComponent(reviewId)}`, { method: "DELETE", headers: { token } });
}
