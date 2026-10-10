
export type CartLine = {
  productId: string;
  unitPrice: number;
  quantity: number;
};

export type TotalOptions = {
  taxRate: number;
  discountPercent: number;
};

export function calculateTotal(
  lines: CartLine[],
  options: TotalOptions,
): number {
  const { taxRate, discountPercent } = options;

  if (taxRate < 0 || discountPercent < 0 || discountPercent > 100) {
    throw new Error("Invalid tax rate or discount");
  }

  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );

  const discounted = subtotal * (1 - discountPercent / 100);
  return Number((discounted * (1 + taxRate)).toFixed(2));
}
