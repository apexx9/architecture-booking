import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_URL } from "./config";
import { type ApiErrorResponse } from "./errors";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _csrfRetry?: boolean;
};

let refreshing: Promise<boolean> | null = null;

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

const PUBLIC_AUTH_ENDPOINTS = ["/auth/login", "/auth/register"];

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

async function refreshSession(): Promise<boolean> {
  try {
    await api.post("/auth/refresh");

    return true;
  } catch {
    return false;
  }
}

async function handleRefreshFailure() {
  const { default: useAuthStore } = await import("@/store/use-auth-store");

  useAuthStore.getState().clearAuth();
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