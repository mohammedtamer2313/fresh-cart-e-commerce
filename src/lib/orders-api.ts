const API_V1 = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getUserIdFromToken(token: string): string | null {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const payload: unknown = JSON.parse(decoded);
    return isRecord(payload) && typeof payload.id === "string" && payload.id ? payload.id : null;
  } catch {
    return null;
  }
}

export async function getUserOrders(token: string, signal?: AbortSignal): Promise<unknown[]> {
  const userId = getUserIdFromToken(token);
  if (!userId) throw new Error("Your session does not include a valid user ID.");

  const response = await fetch(`${API_V1}/orders/user/${encodeURIComponent(userId)}`, {
    headers: { token, "Cache-Control": "no-cache" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Could not load your orders.");
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("The orders API returned an invalid response.");
  return payload as unknown[];
}
