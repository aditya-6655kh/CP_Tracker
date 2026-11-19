import { isAxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<{ message?: string; errors?: string[]; data?: string[] }>(error)) return fallback;
  const response = error.response?.data;
  const errors = response?.errors ?? response?.data;
  return Array.isArray(errors) && errors.length ? errors.join(", ") : response?.message ?? fallback;
}
