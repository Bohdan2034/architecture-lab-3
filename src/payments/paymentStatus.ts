export type PaymentStatus =
  | "paid"
  | "processing"
  | "failed"
  | "unknown";

export function normalizePaymentStatus(state: string): PaymentStatus {
  switch (state) {
    case "succeeded":
      return "paid";
    case "requires_action":
      return "processing";
    case "declined":
      return "failed";
    default:
      return "unknown";
  }
}
