"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AUTH_STATE_CHANGE_EVENT } from "@/lib/auth-state";
import { getSession } from "@/lib/session";

type Access = "signed-in" | "guest";

export default function AuthRouteGuard({ children, access }: { children: ReactNode; access: Access }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const syncAccess = () => {
      const signedIn = Boolean(getSession()?.token);
      const allowed = access === "signed-in" ? signedIn : !signedIn;
      setAuthorized(allowed);
      setChecked(true);
      if (!allowed) router.replace(access === "signed-in" ? `/login?next=${encodeURIComponent(pathname)}` : "/profile");
    };

    syncAccess();
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAccess);
    window.addEventListener("storage", syncAccess);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAccess);
      window.removeEventListener("storage", syncAccess);
    };
  }, [access, pathname, router]);

  if (!checked || !authorized) {
    return <div className="container mx-auto px-4 py-16 text-center text-gray-500">Checking your account…</div>;
  }

  return children;
}
