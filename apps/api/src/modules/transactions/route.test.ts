import { mock, describe, it, expect, beforeEach, beforeAll } from "bun:test";
import { Elysia } from "elysia";

const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
const mockTenantId = "8f682d46-419b-449e-9d29-c09e3a62888c";
const mockTrxId = "550e8400-e29b-41d4-a716-446655440006";

const validTrx = {
  id: mockTrxId,
  tenantId: mockTenantId,
  cashierId: mockUserId,
  trxNumber: "TRX123",
  totalAmount: "1000",
  amountPaid: "1000",
  changeAmount: "0",
  paymentMethod: "cash",
  status: "success",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Transaction Routes", () => {
  let app: Elysia;
  let service: any;

  beforeAll(async () => {
    mock.module("./service.ts", () => ({
      createTransaction: mock(),
      getTransactionDetail: mock(),
      getTransactions: mock(),
      voidTransaction: mock(),
    }));

    mock.module("elysia-rate-limit", () => ({
      rateLimit: () => new Elysia(),
    }));

    const mockAuth = new Elysia({ name: "auth" }).derive(() => ({
      userId: mockUserId,
      tenantId: mockTenantId,
      role: "admin",
    }));

    mock.module("@plugin", () => ({
      authPlugin: mockAuth,
      adminGuard: new Elysia({ name: "admin-guard" }).use(mockAuth),
      ConflictError: class extends Error {},
    }));

    const { transactionRoutes } = await import("./route");
    app = new Elysia().use(transactionRoutes);
    service = await import("./service.ts");
  });

  beforeEach(() => {
    mock.restore();
  });

  const headers = { 
    "Authorization": "Bearer mock-token",
    "Content-Type": "application/json"
  };

  it("GET /transactions should return 200", async () => {
    service.getTransactions.mockResolvedValue({
      data: [{
        ...validTrx,
        cashier: { name: "Cashier" },
        items: []
      }],
      meta: { page: 1, limit: 10, totalData: 1, totalPages: 1 }
    });
    const response = await app.handle(new Request("http://localhost/transactions", { headers }));
    expect(response.status).toBe(200);
  });

  it("GET /transactions/:id should return 200", async () => {
    service.getTransactionDetail.mockResolvedValue({
      ...validTrx,
      items: [
        { 
          id: "550e8400-e29b-41d4-a716-446655440007", 
          qty: 1, 
          unitPrice: "1000", 
          subtotal: "1000", 
          createdAt: new Date(),
          product: { 
            id: "550e8400-e29b-41d4-a716-446655440002", 
            name: "Indomie",
            createdAt: new Date()
          } 
        }
      ]
    });
    const response = await app.handle(new Request(`http://localhost/transactions/${mockTrxId}`, { headers }));
    expect(response.status).toBe(200);
  });

  it("POST /transactions should return 201", async () => {
    service.createTransaction.mockResolvedValue({
      trxNumber: "TRX123",
      totalAmount: 1000,
      changeAmount: 0
    });
    const response = await app.handle(
      new Request("http://localhost/transactions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          amountPaid: 1000,
          paymentMethod: "cash",
          items: [{ productId: "550e8400-e29b-41d4-a716-446655440002", qty: 1, unitPrice: 1000 }],
        }),
      })
    );
    expect(response.status).toBe(201);
  });

  it("POST /transactions/:id/void should return 200", async () => {
    service.voidTransaction.mockResolvedValue({ trxNumber: "TRX123" });
    const response = await app.handle(
      new Request(`http://localhost/transactions/${mockTrxId}/void`, { 
        method: "POST", 
        headers 
      })
    );
    expect(response.status).toBe(200);
  });
});
