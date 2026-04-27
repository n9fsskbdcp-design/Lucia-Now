export const PAYMENT_DEADLINE_HOURS = 24;

export function createPaymentDeadline() {
  const date = new Date();
  date.setHours(date.getHours() + PAYMENT_DEADLINE_HOURS);
  return date.toISOString();
}

export function isPaymentExpired(paymentDueAt: string | null | undefined) {
  if (!paymentDueAt) return false;

  return new Date(paymentDueAt).getTime() < Date.now();
}

export function formatPaymentDeadline(paymentDueAt: string | null | undefined) {
  if (!paymentDueAt) return null;

  return new Date(paymentDueAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}