import axios from "axios";

export type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

/**
 * Why a request failed, from the caller's point of view.
 *
 * `unreachable` means no HTTP response ever arrived: the API is down, the
 * browser blocked the request (CORS, mixed content), or it timed out. These
 * are transport failures and are indistinguishable from one another in the
 * browser, which is exactly why they must not be reported as a server-side
 * verdict such as "this link is invalid".
 *
 * `http` means the server answered and the status/body describe the failure.
 */
export type ApiFailureKind = "unreachable" | "http";

export type ClassifiedApiError = {
  kind: ApiFailureKind;
  message: string;
  status?: number;
  /** Present only when the server actually supplied a message. */
  serverMessage?: string;
};

const GENERIC_MESSAGE = "Something went wrong.";

export function classifyApiError(error: unknown): ClassifiedApiError {
  if (!axios.isAxiosError(error) || !error.response) {
    return { kind: "unreachable", message: GENERIC_MESSAGE };
  }

  const { status, data } = error.response;
  const body = data as ApiErrorResponse | undefined;

  if (!body?.message) {
    return { kind: "http", message: GENERIC_MESSAGE, status };
  }

  const serverMessage = Array.isArray(body.message)
    ? body.message.join(", ")
    : body.message;

  return { kind: "http", message: serverMessage, status, serverMessage };
}

export function getApiErrorMessage(error: unknown): string {
  return classifyApiError(error).message;
}
