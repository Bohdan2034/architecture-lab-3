
export type PaymentStatus =
  | "paid"
  | "processing"
  | "failed"
  | "unknown";

export type ProviderPaymentRequest = {
  orderId: string;
  paymentToken: string;
  currency: string;
  amount: number;
};

export type ProviderPaymentResult = {
  reference: string;
  status: PaymentStatus;
};

export interface PaymentProvider {
  processPayment(
    request: ProviderPaymentRequest,
  ): Promise<ProviderPaymentResult>;
}
