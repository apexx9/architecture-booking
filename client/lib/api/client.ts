import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_URL } from "./config";
import { type ApiErrorResponse } from "./errors";
import {
  broadcastSessionEvent,
  markRefreshed,
  wasRefreshedRecently,
  withRefreshLock,
} from "@/lib/auth/session-events";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _csrfRetry?: boolean;
};

let refreshing: Promise<boolean> | null = null;

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

/*
 * Endpoints that are reachable without a session. A 401 from any of these is a
 * real answer about the request, so the interceptor must reject it rather than
 * spend a refresh call on it. `verify-email` and `resend-verification` belong
 * here: without them a rejected token triggers `POST /auth/refresh` and then
 * replays the original request, which burns a second single-use token attempt
 * and buries the real error under an unrelated refresh failure.
 */
const PUBLIC_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/resend-verification",
];

const NON_MUTATING_METHODS = ["GET", "HEAD", "OPTIONS"];

function isPublicAuthEndpoint(url?: string) {
  if (!url) {
    return false;
  }

  return PUBLIC_AUTH_ENDPOINTS.some(
    (endpoint) => url === endpoint || url.startsWith(`${endpoint}?`),
  );
}

function isCsrfFailure(error: AxiosError) {
  const data = error.response?.data as ApiErrorResponse | undefined;

  return (
    typeof data?.message === "string" &&
    data.message.toLowerCase().includes("csrf")
  );
}

async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  csrfPromise ??= api
    .get<{ csrfToken: string }>("/auth/csrf")
    .then((response) => {
      csrfToken = response.data.csrfToken;
      return csrfToken;
    })
    .finally(() => {
      csrfPromise = null;
    });

  return csrfPromise;
}

/**
 * Rotates the session, once for the whole browser rather than once per tab.
 *
 * `POST /auth/refresh` invalidates the token it was given and issues a new one,
 * and the server answers a second use of an already-rotated token by revoking
 * the entire session family. Two tabs refreshing at the same instant therefore
 * race to log the user out: one wins, the other is treated as a stolen token.
 *
 * Two things prevent that. The Web Lock keeps tabs out of each other's way, and
 * a tab that finds a rotation already landed moments ago replays its request
 * against the new cookies instead of rotating again.
 *
 * @returns whether the session is usable. `false` means the cookies are spent.
 */
async function refreshSession(): Promise<boolean> {
  return withRefreshLock(async () => {
    if (wasRefreshedRecently()) {
      return true;
    }

    if (!(await refreshOnce())) {
      return false;
    }

    markRefreshed();
    broadcastSessionEvent({ type: "refreshed" });

    return true;
  });
}

/** One rotation attempt, retrying once if the CSRF pair turns out to be stale. */
async function refreshOnce(): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      /*
       * The CSRF token is a cached cookie plus a header that has to match it,
       * and every tab shares that cookie. A sibling tab fetching its own pair
       * leaves ours stale, so drop the cache and take a fresh pair rather than
       * spending a rotation on a request the server will reject on form alone.
       */
      csrfToken = null;

      await ensureCsrfToken();

      await api.post("/auth/refresh");

      return true;
    } catch (error) {
      /*
       * A CSRF rejection says nothing about whether the session is still valid,
       * so it must not be allowed to end the session. Treating it as an expired
       * session is what makes a busy browser look like it keeps signing the user
       * out for no reason.
       */
      if (attempt === 0 && isCsrfFailure(error as AxiosError)) {
        continue;
      }

      return false;
    }
  }

  return false;
}

async function handleRefreshFailure() {
  const { default: useAuthStore } = await import("@/store/use-auth-store");

  /*
   * One tab losing a race must not leave its siblings showing a workspace whose
   * session no longer exists, so the outcome is broadcast rather than local.
   */
  broadcastSessionEvent({ type: "signed-out", reason: "session-expired" });
  useAuthStore.getState().clearAuth("session-expired");
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

api.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();

  if (method && !NON_MUTATING_METHODS.includes(method)) {
    const token = await ensureCsrfToken();
    config.headers.set("x-csrf-token", token);
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes("/auth/logout")) {
      csrfToken = null;
    }

    return response;
  },

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    const status = error.response?.status;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    if (isCsrfFailure(error) && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      csrfToken = null;

      try {
        const token = await ensureCsrfToken();
        originalRequest.headers.set("x-csrf-token", token);
      } catch {
        return Promise.reject(error);
      }

      return api(originalRequest);
    }

    if (
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh") ||
      isPublicAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    refreshing ??= refreshSession().finally(() => {
      refreshing = null;
    });

    const refreshed = await refreshing;

    if (!refreshed) {
      await handleRefreshFailure();

      return Promise.reject(error);
    }

    return api(originalRequest);
  },
);