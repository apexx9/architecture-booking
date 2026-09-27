import axios from "axios";

export type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong.";
  }

  const data = error.response?.data as ApiErrorResponse | undefined;

  if (!data?.message) {
    return "Something went wrong.";
  }

  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }

  return data.message;
}
