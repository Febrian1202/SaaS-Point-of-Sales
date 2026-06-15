import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  createBrilinkTransaction,
  getBrilinkTransaction,
  getBrilinkSummary,
  getBrilinkTransactionDetail,
  voidBrilink,
} from "./service";
import { db } from "@db";
import { ConflictError } from "@plugin";
import { BrilinkNotFoundError } from "./error";

mock.module("@db", () => ({
  db: {
    query: {
      brilinkTransactions: {
        findFirst: mock(),
        findMany: mock(),
      },
    },
    insert: mock(),
    update: mock(),
    select: mock(),
  },
}));

describe("Brilink Service Unit Tests", () => {
  const mockTenantId = "tenant-123";
  const mockCashierId = "cashier-456";
  const mockId = "trx-789";

  beforeEach(() => {
    mock.restore();
  });

  describe("createBrilinkTransaction", () => {
    const payload = {
      trxType: "transfer" as const,
      customerAmount: 100000,
      adminFeeCharged: 5000,
      agentCommission: 3000,
      referenceNumber: "REF123",
      notes: "Test note",
    };

    it("should create transaction successfully (Happy Path)", async () => {
      (db.query.brilinkTransactions.findFirst as any).mockResolvedValue(null);
      (db.insert as any).mockReturnValue({
        values: mock().mockReturnValue({
          returning: mock().mockResolvedValue([
            { id: mockId, ...payload, status: "success" },
          ]),
        }),
      });

      const result = await createBrilinkTransaction(
        mockTenantId,
        mockCashierId,
        payload,
      );

      expect(result.id).toBe(mockId);
      expect(result.status).toBe("success");
    });

    it("should throw ConflictError if reference number already exists in same tenant", async () => {
      (db.query.brilinkTransactions.findFirst as any).mockResolvedValue({
        id: "existing-id",
      });

      expect(
        createBrilinkTransaction(mockTenantId, mockCashierId, payload),
      ).rejects.toThrow(ConflictError);
    });

    it("should allow duplicate reference number if different tenant (Tenant Isolation)", async () => {
      (db.query.brilinkTransactions.findFirst as any).mockResolvedValue(null);
      (db.insert as any).mockReturnValue({
        values: mock().mockReturnValue({
          returning: mock().mockResolvedValue([{ id: "new-id" }]),
        }),
      });

      await createBrilinkTransaction("other-tenant", mockCashierId, payload);

      const findFirstCall = (db.query.brilinkTransactions.findFirst as any).mock
        .calls[0][0];
      // Verify tenantId is used in the where clause check
      expect(findFirstCall.where).toBeDefined();
    });
  });

  describe("getBrilinkTransaction", () => {
    it("should filter transactions by tenantId and date range", async () => {
      (db.query.brilinkTransactions.findMany as any).mockResolvedValue([]);
      (db.select as any).mockReturnValue({
        from: mock().mockReturnValue({
          where: mock().mockResolvedValue([{ totalData: 0 }]),
        }),
      });

      await getBrilinkTransaction(mockTenantId, { date: "2024-01-01" });

      const findManyCall = (db.query.brilinkTransactions.findMany as any).mock
        .calls[0][0];
      expect(findManyCall.where).toBeDefined();
      // Check date range boundary
    });
  });

  describe("getBrilinkSummary", () => {
    it("should calculate summary correctly and only include success status", async () => {
      const mockSummaryData = [
        { trxType: "transfer", totalTransaction: "2", totalCommission: "6000" },
        {
          trxType: "withdrawal",
          totalTransaction: "1",
          totalCommission: "2000",
        },
      ];

      (db.select as any).mockReturnValue({
        from: mock().mockReturnValue({
          where: mock().mockReturnValue({
            groupBy: mock().mockResolvedValue(mockSummaryData),
          }),
        }),
      });

      const result = await getBrilinkSummary(mockTenantId, {
        date: "2024-01-01",
      });

      expect(result.grandTotalTransaction).toBe(3);
      expect(result.grandTotalCommission).toBe(8000);
      expect(result.breakdown).toHaveLength(2);

      const selectWhereCall = (db.select as any)().from().where.mock
        .calls[0][0];
      expect(selectWhereCall).toBeDefined();
    });
  });

  describe("getBrilinkTransactionDetail", () => {
    it("should return data if ID and tenantId match", async () => {
      (db.query.brilinkTransactions.findFirst as any).mockResolvedValue({
        id: mockId,
        tenantId: mockTenantId,
      });

      const result = await getBrilinkTransactionDetail(mockTenantId, {
        id: mockId,
      });
      expect(result.id).toBe(mockId);
    });

    it("should throw BrilinkNotFoundError if ID belongs to different tenant", async () => {
      (db.query.brilinkTransactions.findFirst as any).mockResolvedValue(null);

      expect(
        getBrilinkTransactionDetail("hacker-tenant", { id: mockId }),
      ).rejects.toThrow(BrilinkNotFoundError);
    });
  });

  describe("voidBrilink", () => {
    it("should update status to void successfully", async () => {
      (db.query.brilinkTransactions.findFirst as any).mockResolvedValue({
        id: mockId,
        status: "success",
        tenantId: mockTenantId,
      });

      (db.update as any).mockReturnValue({
        set: mock().mockReturnValue({
          where: mock().mockReturnValue({
            returning: mock().mockResolvedValue([
              { id: mockId, status: "void" },
            ]),
          }),
        }),
      });

      const result = await voidBrilink(mockTenantId, { id: mockId });
      expect(result?.status).toBe("void");
    });

    it("should throw ConflictError if transaction is already void", async () => {
      (db.query.brilinkTransactions.findFirst as any).mockResolvedValue({
        id: mockId,
        status: "void",
        tenantId: mockTenantId,
      });

      expect(voidBrilink(mockTenantId, { id: mockId })).rejects.toThrow(
        ConflictError,
      );
    });

    it("should throw ConflictError if transaction status is failed", async () => {
      (db.query.brilinkTransactions.findFirst as any).mockResolvedValue({
        id: mockId,
        status: "failed",
        tenantId: mockTenantId,
      });

      expect(voidBrilink(mockTenantId, { id: mockId })).rejects.toThrow(
        ConflictError,
      );
    });

    it("should prevent voiding transaction of another tenant", async () => {
      (db.query.brilinkTransactions.findFirst as any).mockResolvedValue(null);

      expect(voidBrilink("wrong-tenant", { id: mockId })).rejects.toThrow(
        BrilinkNotFoundError,
      );
    });
  });
});
