
import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateTotal,
  type CartLine,
} from "../src/shared/calculateTotal.ts";

test("calculates subtotal with tax and discount", () => {
  const lines: CartLine[] = [
    { productId: "book", unitPrice: 100, quantity: 2 },
  ];

  const total = calculateTotal(lines, {
    taxRate: 0.2,
    discountPercent: 10,
  });

  assert.equal(total, 216);
});

test("does not mutate the input cart lines", () => {
  const lines: CartLine[] = [
    { productId: "book", unitPrice: 100, quantity: 2 },
  ];
  const original = structuredClone(lines);

  calculateTotal(lines, {
    taxRate: 0.2,
    discountPercent: 0,
  });

  assert.deepEqual(lines, original);
});

test("calculates total without tax or discount", () => {
  const lines: CartLine[] = [
    { productId: "book", unitPrice: 50, quantity: 2 },
  ];

  assert.equal(
    calculateTotal(lines, {
      taxRate: 0,
      discountPercent: 0,
    }),
    100,
  );
});

test("rejects an invalid discount", () => {
  assert.throws(
    () =>
      calculateTotal([], {
        taxRate: 0.2,
        discountPercent: 101,
      }),
    /Invalid tax rate or discount/,
  );
});
