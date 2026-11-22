import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

const SESSION_COOKIE = "freshcart_session";
const SESSION_DAYS = 7;
// Configure NEXT_PUBLIC_SESSION_ENCRYPTION_KEY for deployments. A client-side key
// is visible to browsers, so this encryption provides obfuscation, not XSS protection.
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_SESSION_ENCRYPTION_KEY ?? "freshcart-development-session-key";

export interface SessionUser {
  id?: string;
  name?: string;
  email?: string;
}

export interface AuthSession {
  token: string;
  user: SessionUser;
}

export function encryptData(value: unknown): string {
  return CryptoJS.AES.encrypt(JSON.stringify(value), ENCRYPTION_KEY).toString();
}

export function decryptData<T>(encryptedValue: string): T | null {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  Cookies.set(SESSION_COOKIE, encryptData(session), {
    expires: SESSION_DAYS,
    path: "/",
    secure: true,
    sameSite: "strict",
  });
}

export function getSession(): AuthSession | null {
  const encryptedValue = Cookies.get(SESSION_COOKIE);
  if (!encryptedValue) return null;

  const session = decryptData<AuthSession>(encryptedValue);
  if (!session || typeof session.token !== "string" || !session.token || typeof session.user !== "object" || session.user === null) {
    removeSession();
    return null;
  }
  return session;
}

export function removeSession(): void {
  Cookies.remove(SESSION_COOKIE, { path: "/", sameSite: "strict" });
}
