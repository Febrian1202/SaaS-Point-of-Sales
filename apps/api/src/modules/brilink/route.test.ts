import { mock, describe, it, expect, beforeEach, beforeAll } from "bun:test";
import { Elysia } from "elysia";

const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
const mockTenantId = "8f682d46-419b-449e-9d29-c09e3a62888c";
const mockBrilinkId = "550e8400-e29b-41d4-a716-446655440001";

const validBrilink = {
  id: mockBrilinkId,
  tenantId: mockTenantId,
  cashierId: mockUserId,
  trxType: "transfer",
  customerAmount: "1000",
  adminFeeCharged: "100",
  agentCommission: "50",
  status: "success",
  referenceNumber: "REF123",
  notes: "Test",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Brilink Routes", () => {
  let app: Elysia;
  let service: any;

  beforeAll(async () => {
    mock.module("./service", () => ({
      createBrilinkTransaction: mock(),
      getBrilinkSummary: mock(),
      getBrilinkTransaction: mock(),
      getBrilinkTransactionDetail: mock(),
      voidBrilink: mock(),
    }));

    mock.module("elysia-rate-limit", () => ({
      rateLimit: () => new Elysia(),
    }));

    const mockAuth = new Elysia({ name: "auth" }).derive(() => ({
      userId: mockUserId,
      tenantId: mockTenantId,
      role: "admin",
    }));

    mock.module("@/plugins", () => ({
      authPlugin: mockAuth,
      adminGuard: new Elysia({ name: "admin-guard" }).use(mockAuth),
      ConflictError: class extends Error {},
    }));

    const { brilinkRoutes } = await import("./route");
    app = new Elysia().use(brilinkRoutes);
    service = await import("./service");
  });

  beforeEach(() => {
    mock.restore();
  });

  const headers = {
    Authorization: "Bearer mock-token",
    "Content-Type": "application/json",
  };

  it("GET /brilink should return 200", async () => {
    service.getBrilinkTransaction.mockResolvedValue({
      data: [
        {
          ...validBrilink,
          cashier: { name: "Cashier" },
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        totalData: 1,
        totalPages: 1,
      },
    });
    const response = await app.handle(
      new Request("http://localhost/brilink", { headers }),
    );
    expect(response.status).toBe(200);
  });

  it("GET /brilink/summary should return 200", async () => {
    service.getBrilinkSummary.mockResolvedValue({
      date: "2024-01-01",
      grandTotalTransaction: 1,
      grandTotalCommission: 100,
      grandTotalVolume: 1000,
      breakdown: [
        { trxType: "transfer", totalTransaction: 1, totalCommission: 100, totalVolume: 1000 },
      ],
    });
    const response = await app.handle(
      new Request("http://localhost/brilink/summary?date=2024-01-01", {
        headers,
      }),
    );
    expect(response.status).toBe(200);
  });

  it("GET /brilink/:id should return 200", async () => {
    service.getBrilinkTransactionDetail.mockResolvedValue(validBrilink);
    const response = await app.handle(
      new Request(`http://localhost/brilink/${mockBrilinkId}`, { headers }),
    );
    expect(response.status).toBe(200);
  });

  it("POST /brilink should return 201", async () => {
    service.createBrilinkTransaction.mockResolvedValue(validBrilink);
    const response = await app.handle(
      new Request("http://localhost/brilink", {
        method: "POST",
        headers,
        body: JSON.stringify({
          trxType: "transfer",
          customerAmount: 1000,
          adminFeeCharged: 100,
          agentCommission: 50,
          referenceNumber: "REF123",
        }),
      }),
    );
    expect(response.status).toBe(201);
  });

  it("POST /brilink/:id/void should return 200", async () => {
    service.voidBrilink.mockResolvedValue({
      id: mockBrilinkId,
      referenceNumber: "REF123",
      status: "void",
    });
    const response = await app.handle(
      new Request(`http://localhost/brilink/${mockBrilinkId}/void`, {
        method: "POST",
        headers,
      }),
    );
    expect(response.status).toBe(200);
  });
});
