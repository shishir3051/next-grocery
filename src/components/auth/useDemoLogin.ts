"use client";

import { useCallback, useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { DEMO_ACCOUNTS, type DemoRole } from "@/lib/demo";

/**
 * One-click sign-in to a live-demo account (admin, customer or rider).
 *
 * `available` is true only when the server runs with DEMO_MODE=true (the "demo" sign-in
 * provider exists). `login(role)` signs in and opens that role's home page with a full
 * page load, so every part of the app sees the new session.
 */
export function useDemoLogin() {
  const [available, setAvailable] = useState(false);
  const [loadingRole, setLoadingRole] = useState<DemoRole | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getProviders()
      .then(providers => { if (active) setAvailable(Boolean(providers?.demo)); })
      .catch(() => { /* providers unavailable: keep demo logins hidden */ });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (role: DemoRole) => {
    setError("");
    setLoadingRole(role);
    try {
      const result = await signIn("demo", { role, redirect: false });
      if (!result || result.error) {
        setError(result?.error && result.error !== "CredentialsSignin"
          ? result.error
          : "The demo login isn't available right now. Please try again.");
        setLoadingRole(null);
        return;
      }
      window.location.assign(DEMO_ACCOUNTS[role].home);
    } catch {
      setError("The demo login isn't available right now. Please try again.");
      setLoadingRole(null);
    }
  }, []);

  return { available, login, loadingRole, error };
}
