
import test from "node:test";
import assert from "node:assert/strict";
import { database, resetDatabase } from "../src/database.ts";
import { StockRepository } from "../src/inventory/StockRepository.ts";

test("reserves stock when all requested products are available", () => {
  resetDatabase();

  database.stock.set("book", {
    productId: "book",
    available: 5,
  });

  const stock = new StockRepository();
  stock.reserve([
    { productId: "book", quantity: 2 },
  ]);

  assert.equal(database.stock.get("book")?.available, 3);
});

test("does not change any stock when one product is unavailable", () => {
  resetDatabase();

  database.stock.set("book", {
    productId: "book",
    available: 5,
  });

  database.stock.set("laptop", {
    productId: "laptop",
    available: 1,
  });

  const stock = new StockRepository();

  assert.throws(
    () =>
      stock.reserve([
        { productId: "book", quantity: 2 },
        { productId: "laptop", quantity: 3 },
      ]),
    /Insufficient stock for laptop/,
  );

  assert.equal(database.stock.get("book")?.available, 5);
  assert.equal(database.stock.get("laptop")?.available, 1);
});

test("combines duplicate product lines before reserving stock", () => {
  resetDatabase();

  database.stock.set("book", {
    productId: "book",
    available: 5,
  });

  const stock = new StockRepository();

  stock.reserve([
    { productId: "book", quantity: 2 },
    { productId: "book", quantity: 2 },
  ]);

  assert.equal(database.stock.get("book")?.available, 1);
});

test("rejects invalid quantities without changing stock", () => {
  resetDatabase();

  database.stock.set("book", {
    productId: "book",
    available: 5,
  });

  const stock = new StockRepository();

  assert.throws(
    () => stock.reserve([{ productId: "book", quantity: 0 }]),
    /Invalid quantity/,
  );

  assert.equal(database.stock.get("book")?.available, 5);
});

test("releases previously reserved stock", () => {
  resetDatabase();

  database.stock.set("book", {
    productId: "book",
    available: 5,
  });

  const stock = new StockRepository();

  stock.reserve([
    { productId: "book", quantity: 2 },
  ]);

  assert.equal(database.stock.get("book")?.available, 3);

  stock.release([
    { productId: "book", quantity: 2 },
  ]);

  assert.equal(database.stock.get("book")?.available, 5);
});
