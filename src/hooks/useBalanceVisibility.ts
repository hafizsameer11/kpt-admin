import { useCallback, useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

const STORAGE_KEY = "kipit:balance-hidden";

/**
 * MOB-021 — Balance Hidden State.
 * The hide/show preference persists across screens and reloads.
 */
export function useBalanceVisibility() {
  const [hidden, setHidden] = useState(false);

  // Read after mount to avoid a hydration mismatch.
  useEffect(() => {
    try {
      setHidden(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* storage unavailable */
    }
    const onChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setHidden(e.newValue === "1");
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const naira = (value: number) =>
    `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

  const mask = useCallback(
    (value: number) => (hidden ? "₦••••••" : naira(value)),
    [hidden],
  );

  return { hidden, toggle, mask, naira };
}

/**
 * Empty-state preview for a brand new user: append ?state=new to any home URL.
 */
export function useIsNewUser() {
  return useRouterState({
    select: (s) => (s.location.search as { state?: string })?.state === "new",
  });
}
