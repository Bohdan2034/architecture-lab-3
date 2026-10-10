
import { database } from "../database.ts";
import type { CartLine } from "../shared/calculateTotal.ts";
import { PaymentService } from "../payments/PaymentService.ts";
import { StockRepository } from "../inventory/StockRepository.ts";

export class OrderService {
  private readonly payments: PaymentService;
  private readonly stock: StockRepository;

  constructor(
    payments = new PaymentService(),
    stock = new StockRepository(),
  ) {
    this.payments = payments;
    this.stock = stock;
  }

  async placeOrder(
    orderId: string,
    lines: CartLine[],
    total: number,
    payment: { paymentToken: string; currency: string },
  ) {
    this.stock.reserve(lines);

    database.orders.set(orderId, {
      id: orderId,
      status: "created",
      total,
    });

    const paymentResult = await this.payments.processPayment({
      orderId,
      paymentToken: payment.paymentToken,
      currency: payment.currency,
      amount: total,
    });

    if (paymentResult.status === "failed") {
  this.stock.release(lines);
}

    const order = database.orders.get(orderId)!;

    order.paymentStatus = paymentResult.status;
    order.status =
      paymentResult.status === "paid" ? "confirmed" : "payment_pending";

    return { ...order };
  }
}
