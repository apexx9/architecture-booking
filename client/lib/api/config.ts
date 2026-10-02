const envApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_URL;

export const API_URL = (envApiUrl ?? "http://localhost:8000").replace(/\/+$/, "");
