
import type {
  PaymentProvider,
  ProviderPaymentRequest,
  ProviderPaymentResult,
} from "../PaymentProvider.ts";

type WalletResponse = {
  transactionId: string;
  result: "accepted" | "awaiting_confirmation" | "rejected";
};

class WalletClient {
  async pay(request: ProviderPaymentRequest): Promise<WalletResponse> {
    let result: WalletResponse["result"] = "accepted";

    if (request.paymentToken.startsWith("fail_")) {
      result = "rejected";
    } else if (request.paymentToken.startsWith("pending_")) {
      result = "awaiting_confirmation";
    }

    return {
      transactionId: `wallet_${request.paymentToken}`,
      result,
    };
  }
}

export class WalletAdapter implements PaymentProvider {
  private readonly client: WalletClient;

  constructor() {
    this.client = new WalletClient();
  }

  async processPayment(
    request: ProviderPaymentRequest,
  ): Promise<ProviderPaymentResult> {
    const response = await this.client.pay(request);

    const status =
      response.result === "accepted"
        ? "paid"
        : response.result === "awaiting_confirmation"
          ? "processing"
          : "failed";

    return {
      reference: response.transactionId,
      status,
    };
  }
}
