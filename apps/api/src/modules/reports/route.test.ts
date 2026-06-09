import { mock, describe, it, expect, beforeEach, beforeAll } from "bun:test";
import { Elysia } from "elysia";

const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
const mockTenantId = "8f682d46-419b-449e-9d29-c09e3a62888c";

const validSummary = {
  id: "550e8400-e29b-41d4-a716-446655440005",
  tenantId: mockTenantId,
  summaryDate: "2024-05-31",
  retailRevenue: "1000",
  retailCogs: "800",
  brilinkCommission: "200",
  totalRevenue: "1200",
  grossProfit: "400",
  trxCount: 10,
  generatedAt: new Date(),
};

describe("Report Routes", () => {
  let app: Elysia;
  let service: any;

  beforeAll(async () => {
    mock.module("./service", () => ({
      getDailySummary: mock(),
      getMonthlySummary: mock(),
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

    const { reportRoutes } = await import("./route");
    app = new Elysia().use(reportRoutes);
    service = await import("./service");
  });

  beforeEach(() => {
    mock.restore();
  });

  const headers = { 
    "Authorization": "Bearer mock-token",
    "Content-Type": "application/json"
  };

  it("GET /reports/daily should return 200", async () => {
    service.getDailySummary.mockResolvedValue(validSummary);
    const response = await app.handle(new Request("http://localhost/reports/daily?date=2024-05-31", { headers }));
    expect(response.status).toBe(200);
  });

  it("GET /reports/monthly should return 200", async () => {
    service.getMonthlySummary.mockResolvedValue({
      month: "2024-05",
      retailRevenue: 1000,
      retailCogs: 800,
      brilinkCommission: 200,
      totalRevenue: 1200,
      grossProfit: 400,
      trxCount: 10,
    });
    const response = await app.handle(new Request("http://localhost/reports/monthly?month=2024-05", { headers }));
    expect(response.status).toBe(200);
  });
});
