"use client";

import { useEffect, type ReactNode } from "react";
import { authService } from "@/services/auth.service";
import { subscribeToSessionEvents } from "@/lib/auth/session-events";
import useAuthStore from "@/store/use-auth-store";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Ceiling on the session check that decides whether a signed-in user may enter.
 *
 * Without one, a request that never settles leaves the workspace showing its
 * "Checking your session" screen forever. Ten seconds is long enough for the
 * check on a slow connection and short enough that a user is never stuck on it.
 */
const BOOTSTRAP_TIMEOUT_MS = 10_000;

/*
 * One check per page load, held outside React.
 *
 * The provider sits in the root layout, so it does not normally remount, but
 * Strict Mode's double-invoke and any future extra host would otherwise repeat
 * the request and give the user two different answers about the same session.
 */
let bootstrap: Promise<void> | null = null;

/** Settles with `work`'s outcome, or rejects once `ms` has passed. */
function withDeadline(work: Promise<unknown>, ms: number): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Session check timed out."));
    }, ms);

    void work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function checkSession(): Promise<void> {
  return withDeadline(
    authService.getCurrentUser(),
    BOOTSTRAP_TIMEOUT_MS,
  )
    .then(() => undefined)
    .catch(() => {
      /*
       * No usable session. This is deliberately silent about *why*: a signed-out
       * visitor and a visitor whose check timed out are both simply not
       * authenticated, and the guard routes them the same way. Claiming the
       * session expired here would be a guess.
       */
      useAuthStore.getState().setUnauthenticated();
    });
}

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    bootstrap ??= checkSession();

    return subscribeToSessionEvents((event) => {
      if (event.type !== "signed-out") {
        /*
         * A refresh needs no reaction: the new cookies are already shared by
         * every tab, so a request waiting to be replayed simply succeeds.
         */
        return;
      }

      /*
       * Another tab ended the session — a sign-out, or a refresh that failed
       * everywhere. Keeping our own copy of the user would leave this tab
       * showing a workspace whose session no longer exists.
       */
      useAuthStore.getState().clearAuth("session-expired");
    });
  }, []);

  return children;
}