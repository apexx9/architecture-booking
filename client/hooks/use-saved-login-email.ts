"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * "Save ID" storage for the login screen. Only the email address is ever
 * persisted — the password is never written to storage.
 */
const STORAGE_KEY = "renove:login:email";

const EMPTY = "";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY;
}

/**
 * The server has no localStorage, so the first render must assume "nothing
 * saved". `useSyncExternalStore` then swaps in the real value after hydration
 * instead of producing a server/client markup mismatch.
 */
function getServerSnapshot(): string {
  return EMPTY;
}

export function useSavedLoginEmail() {
  const savedEmail = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const save = useCallback((email: string) => {
    window.localStorage.setItem(STORAGE_KEY, email.trim());
  }, []);

  const clear = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { savedEmail, save, clear };
}
