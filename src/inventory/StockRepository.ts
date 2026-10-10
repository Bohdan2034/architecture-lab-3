
import { database } from "../database.ts";

export type StockReservationLine = {
  productId: string;
  quantity: number;
};

export class StockRepository {
  find(productId: string) {
    return database.stock.get(productId);
  }

  reserve(lines: StockReservationLine[]): void {
    const requested = new Map<string, number>();

    for (const line of lines) {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        throw new Error(`Invalid quantity for ${line.productId}`);
      }

      const current = requested.get(line.productId) ?? 0;
      requested.set(line.productId, current + line.quantity);
    }

    // Спочатку перевіряємо всі товари.
    for (const [productId, quantity] of requested) {
      const row = database.stock.get(productId);

      if (!row || row.available < quantity) {
        throw new Error(`Insufficient stock for ${productId}`);
      }
    }

    // Змінюємо залишки тільки після всіх перевірок.
    for (const [productId, quantity] of requested) {
      const row = database.stock.get(productId)!;

      database.stock.set(productId, {
        productId,
        available: row.available - quantity,
      });
    }
  }

  release(lines: StockReservationLine[]): void {
    const quantities = new Map<string, number>();

    for (const line of lines) {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        throw new Error(`Invalid quantity for ${line.productId}`);
      }

      const current = quantities.get(line.productId) ?? 0;
      quantities.set(line.productId, current + line.quantity);
    }

    // Переконуємося, що всі товари існують.
    for (const productId of quantities.keys()) {
      if (!database.stock.has(productId)) {
        throw new Error(`Cannot release missing stock for ${productId}`);
      }
    }

    // Повертаємо зарезервовані товари.
    for (const [productId, quantity] of quantities) {
      const row = database.stock.get(productId)!;

      database.stock.set(productId, {
        productId,
        available: row.available + quantity,
      });
    }
  }
}
