import test from "node:test";
import assert from "node:assert/strict";
import { normalizePaymentStatus } from "../src/payments/paymentStatus.ts";

test("normalizes a successful payment", () => {
  assert.equal(normalizePaymentStatus("succeeded"), "paid");
});

test("normalizes a payment requiring further action", () => {
  assert.equal(normalizePaymentStatus("requires_action"), "processing");
});

test("normalizes a declined payment", () => {
  assert.equal(normalizePaymentStatus("declined"), "failed");
});

test("handles an unknown provider status safely", () => {
  assert.equal(normalizePaymentStatus("unexpected_state"), "unknown");
});
