/** datetime-local values describe the browser's local timezone. */
export function toLocalDateTime(iso: string): string {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function goalDeadlineToISO(local: string): string | null {
  const date = new Date(local);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
