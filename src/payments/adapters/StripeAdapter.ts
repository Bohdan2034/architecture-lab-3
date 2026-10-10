
import type {
  PaymentProvider,
  ProviderPaymentRequest,
  ProviderPaymentResult,
} from "../PaymentProvider.ts";
import { StripeClient } from "../internal/StripeClient.ts";
import { normalizePaymentStatus } from "../paymentStatus.ts";

export class StripeAdapter implements PaymentProvider {
  private readonly client: StripeClient;

  constructor(client = new StripeClient()) {
    this.client = client;
  }

  async processPayment(
    request: ProviderPaymentRequest,
  ): Promise<ProviderPaymentResult> {
    const response = await this.client.createCharge({
      id: request.paymentToken,
      amount: Math.round(request.amount * 100),
      currency: request.currency,
      metadata: { orderId: request.orderId },
    });

    return {
      reference: response.charge_id,
      status: normalizePaymentStatus(response.state),
    };
  }
}
