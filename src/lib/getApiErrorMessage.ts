import type { AxiosError } from "axios";

type ErrorItem = { message?: string; msg?: string };

/**
 * Extracts a user-friendly error message from an API error.
 * When the response has an `errors` array (e.g. validation errors), uses the
 * specific messages from it (e.g. "Valid email required") instead of the
 * generic top-level message (e.g. "Validation error").
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as AxiosError<{ message?: string; error?: string; errors?: ErrorItem[] }>).response?.data;
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const messages = data.errors
        .map((e) => (e && typeof e === "object" ? e.message ?? e.msg : null))
        .filter((m): m is string => typeof m === "string" && m.length > 0);
      if (messages.length > 0) return messages.join(". ");
    }
    if (data?.message && typeof data.message === "string") return data.message;
    if (data?.error && typeof data.error === "string") return data.error;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
