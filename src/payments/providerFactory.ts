
import { runtimeConfig } from "../config.ts";
import type { PaymentProvider } from "./PaymentProvider.ts";
import { StripeAdapter } from "./adapters/StripeAdapter.ts";
import { WalletAdapter } from "./adapters/WalletAdapter.ts";

export function createPaymentProvider(): PaymentProvider {
  switch (runtimeConfig.paymentProvider) {
    case "stripe":
      return new StripeAdapter();

    case "wallet":
      return new WalletAdapter();

    default: {
      const unsupported: never = runtimeConfig.paymentProvider;
      throw new Error(`Unsupported payment provider: ${unsupported}`);
    }
  }
}
