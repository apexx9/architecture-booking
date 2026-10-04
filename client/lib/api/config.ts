const envApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!envApiUrl && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_API_URL must be configured in production");
}

export const API_URL = (envApiUrl ?? "http://localhost:8000").replace(/\/+$/, "");

/*
 * These two checks fail the build rather than shipping a bundle that cannot
 * make a single API call. Both failure modes are silent at runtime: a loopback
 * origin and a plaintext origin each surface as a blocked request with no
 * response, which the UI cannot distinguish from a server-side rejection.
 */
if (process.env.NODE_ENV === "production") {
  let parsedApiUrl: URL;

  try {
    parsedApiUrl = new URL(API_URL);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_API_URL must be an absolute URL, received "${API_URL}"`,
    );
  }

  const loopbackHosts = ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"];

  if (loopbackHosts.includes(parsedApiUrl.hostname)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL resolves to the loopback host "${parsedApiUrl.hostname}". ` +
        "Visitors' browsers run on their own machine, so this only ever works for " +
        "you. Set NEXT_PUBLIC_API_URL to the public HTTPS origin of the API.",
    );
  }

  if (parsedApiUrl.protocol !== "https:") {
    throw new Error(
      `NEXT_PUBLIC_API_URL must use https in production, received "${API_URL}". ` +
        "Browsers block plaintext API calls from an https page as mixed content.",
    );
  }
}
