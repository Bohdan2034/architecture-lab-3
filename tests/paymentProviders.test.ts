import { runtimeConfig } from "../src/config.ts";
import { PaymentService } from "../src/payments/PaymentService.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { StripeAdapter } from "../src/payments/adapters/StripeAdapter.ts";
import { WalletAdapter } from "../src/payments/adapters/WalletAdapter.ts";

const request = {
  orderId: "test-order",
  paymentToken: "tok_valid",
  currency: "UAH",
  amount: 100,
};

test("Stripe adapter normalizes a successful payment", async () => {
  const result = await new StripeAdapter().processPayment(request);
  assert.equal(result.status, "paid");
});

test("Stripe adapter normalizes a declined payment", async () => {
  const result = await new StripeAdapter().processPayment({
    ...request,
    paymentToken: "fail_card",
  });
  assert.equal(result.status, "failed");
});

test("Wallet adapter maps its accepted status to paid", async () => {
  const result = await new WalletAdapter().processPayment(request);
  assert.equal(result.status, "paid");
});

test("Wallet adapter maps awaiting confirmation to processing", async () => {
  const result = await new WalletAdapter().processPayment({
    ...request,
    paymentToken: "pending_card",
  });
  assert.equal(result.status, "processing");
});

test("Wallet adapter maps rejection to failed", async () => {
  const result = await new WalletAdapter().processPayment({
    ...request,
    paymentToken: "fail_card",
  });
  assert.equal(result.status, "failed");
});

test("PaymentService uses the configured provider", async () => {
  const originalProvider = runtimeConfig.paymentProvider;

  try {
    runtimeConfig.paymentProvider = "wallet";

    const service = new PaymentService();
    const result = await service.processPayment(request);

    assert.equal(result.status, "paid");
    assert.ok(result.reference.startsWith("wallet_"));
  } finally {
    runtimeConfig.paymentProvider = originalProvider;
  }
});
