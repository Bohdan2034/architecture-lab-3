
import type {
  PaymentProvider,
  ProviderPaymentRequest,
  ProviderPaymentResult,
} from "./PaymentProvider.ts";
import { createPaymentProvider } from "./providerFactory.ts";

export type PaymentRequest = ProviderPaymentRequest;
export type PaymentResult = ProviderPaymentResult;

export class PaymentService {
  private readonly provider: PaymentProvider;

  constructor(provider?: PaymentProvider) {
    this.provider = provider ?? createPaymentProvider();
  }

  async processPayment(
    request: PaymentRequest,
  ): Promise<PaymentResult> {
    return this.provider.processPayment(request);
  }
}
