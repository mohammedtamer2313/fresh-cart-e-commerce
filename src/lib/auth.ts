const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload extends SignInPayload {
  name: string;
  rePassword: string;
  phone: string;
}

export interface AuthResponse {
  message?: string;
  token?: string;
  user?: {
    name?: string;
    email?: string;
    id?: string;
  };
  data?: {
    token?: string;
    user?: {
      name?: string;
      email?: string;
      id?: string;
    };
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseAuthResponse(value: unknown): AuthResponse {
  if (!isRecord(value)) return {};

  const data = isRecord(value.data) ? value.data : undefined;
  const user = isRecord(value.user) ? value.user : undefined;
  const dataUser = data && isRecord(data.user) ? data.user : undefined;
  const parsedUser = user ?? dataUser;

  return {
    message: typeof value.message === "string" ? value.message : undefined,
    token: typeof value.token === "string" ? value.token : undefined,
    user: parsedUser
      ? {
          name: typeof parsedUser.name === "string" ? parsedUser.name : undefined,
          email: typeof parsedUser.email === "string" ? parsedUser.email : undefined,
          id: typeof parsedUser._id === "string" ? parsedUser._id : typeof parsedUser.id === "string" ? parsedUser.id : undefined,
        }
      : undefined,
    data: data
      ? {
          token: typeof data.token === "string" ? data.token : undefined,
          user: dataUser
            ? {
                name: typeof dataUser.name === "string" ? dataUser.name : undefined,
                email: typeof dataUser.email === "string" ? dataUser.email : undefined,
                id: typeof dataUser._id === "string" ? dataUser._id : typeof dataUser.id === "string" ? dataUser.id : undefined,
              }
            : undefined,
        }
      : undefined,
  };
}

export async function submitAuth<TPayload extends SignInPayload | SignUpPayload>(
  endpoint: "signin" | "signup",
  payload: TPayload,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = undefined;
  }

  const result = parseAuthResponse(responseBody);

  if (!response.ok) {
    throw new Error(result.message ?? "Unable to complete your request. Please try again.");
  }

  return result;
}
