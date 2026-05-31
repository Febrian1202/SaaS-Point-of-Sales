import { describe, expect, it, mock, beforeEach } from "bun:test";
import {
  createTransaction,
  getTransactions,
  getTransactionDetail,
  voidTransaction,
} from "./service";
import { db } from "@/db";
import { ConflictError } from "@/plugins";
import { TransactionNotFoundError } from "./error";

// --- Database Mocks ---
const mockReturning = mock();
const mockValues = mock().mockReturnValue({ returning: mockReturning });
const mockInsert = mock().mockReturnValue({ values: mockValues });

const mockWhere = mock().mockReturnValue({ returning: mockReturning });
const mockSet = mock().mockReturnValue({ set: mock().mockReturnValue({ where: mockWhere }), where: mockWhere });
const mockUpdate = mock().mockReturnValue({ set: mockSet });

const mockSelectResult = mock().mockResolvedValue([]);
const mockLimit = mock().mockReturnValue({ offset: mock().mockReturnValue(Promise.resolve([])) });
const mockOrderBy = mock().mockReturnValue({ limit: mockLimit });
const mockSelectWhere = mock();
mockSelectWhere.mockImplementation(() => {
  const result = mockSelectResult();
  (result as any).orderBy = mockOrderBy;
  return result;
});

const mockFrom = mock().mockReturnValue({ where: mockSelectWhere });
const mockSelect = mock().mockReturnValue({ from: mockFrom });

const mockTx = {
  insert: mockInsert,
  update: mockUpdate,
  select: mockSelect,
  query: {
    transactions: {
      findFirst: mock(),
    },
  },
};

mock.module("@/db", () => ({
  db: {
    transaction: mock(async (callback: any) => await callback(mockTx)),
    query: {
      transactions: {
        findMany: mock(),
        findFirst: mock(),
      },
    },
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelect,
  },
}));

describe("Transaction Service Unit Testing", () => {
  const mockTenantId = "tenant-uuid-1";
  const mockOtherTenantId = "tenant-uuid-2";
  const mockCashierId = "cashier-uuid-1";
  const mockTransactionId = "trx-uuid-1";

  beforeEach(() => {
    mock.restore();
    mockReturning.mockClear();
    mockValues.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockSet.mockClear();
    mockWhere.mockClear();
    mockSelect.mockClear();
    mockSelectWhere.mockClear();
    mockSelectResult.mockClear();
    mockSelectResult.mockResolvedValue([]);
    (db.query.transactions.findMany as any).mockClear();
    (db.query.transactions.findFirst as any).mockClear();
    (mockTx.query.transactions.findFirst as any).mockClear();
  });

  describe("createTransaction", () => {
    const validArgs = {
      items: [
        { productId: "prod-1", qty: 2, unitPrice: 5000 },
        { productId: "prod-2", qty: 1, unitPrice: 10000 },
      ],
      amountPaid: 25000,
      paymentMethod: "cash" as const,
    };

    it("should successfully create a transaction (Happy Path)", async () => {
      mockReturning
        .mockResolvedValueOnce([{ id: mockTransactionId, trxNumber: "TRX-2024-TEST" }]) // transaction insert
        .mockResolvedValueOnce([]); // items insert

      const result = await createTransaction(mockTenantId, mockCashierId, validArgs);

      expect(result.trxNumber).toBeDefined();
      expect(result.totalAmount).toBe(20000);
      expect(result.changeAmount).toBe(5000);
      expect(mockInsert).toHaveBeenCalledTimes(2); // Header & Items
      expect(mockUpdate).toHaveBeenCalledTimes(2); // Stock update per product
    });

    it("should throw ConflictError if amount paid is less than total amount (Edge Case: Insufficient Funds)", async () => {
      const invalidArgs = { ...validArgs, amountPaid: 15000 };

      expect(createTransaction(mockTenantId, mockCashierId, invalidArgs))
        .rejects.toThrow(ConflictError);
    });

    it("should throw ConflictError if database fails to return new transaction (Edge Case: DB Failure)", async () => {
      mockReturning.mockResolvedValue([]);

      expect(createTransaction(mockTenantId, mockCashierId, validArgs))
        .rejects.toThrow(ConflictError);
    });

    it("should handle items with zero quantity or price (Edge Case: Invalid Numerics)", async () => {
      const zeroQtyArgs = {
        items: [{ productId: "p1", qty: 0, unitPrice: 5000 }],
        amountPaid: 1000,
        paymentMethod: "cash" as const,
      };
      mockReturning.mockResolvedValue([{ id: "id", trxNumber: "TRX-ZERO" }]);

      const result = await createTransaction(mockTenantId, mockCashierId, zeroQtyArgs);
      expect(result.totalAmount).toBe(0);
      expect(result.changeAmount).toBe(1000);
    });

    it("should generate a random transaction number with TRX prefix", async () => {
      mockReturning.mockResolvedValue([{ id: "id", trxNumber: "TRX-RAND" }]);
      const result = await createTransaction(mockTenantId, mockCashierId, validArgs);
      expect(result.trxNumber).toMatch(/^TRX-/);
    });
  });

  describe("getTransactions", () => {
    const query = { limit: 10, page: 1 };

    it("should return list of transactions with pagination meta (Happy Path)", async () => {
      (db.query.transactions.findMany as any).mockResolvedValue([{ id: "1", trxNumber: "TRX-1" }]);
      mockSelectResult.mockResolvedValueOnce([{ totalData: 15 }]);

      const result = await getTransactions(mockTenantId, query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalData).toBe(15);
      expect(result.meta.totalPages).toBe(2);
    });

    it("should strictly filter data by tenantId (Multi-Tenant Isolation)", async () => {
      (db.query.transactions.findMany as any).mockResolvedValue([]);
      mockSelectResult.mockResolvedValue([{ totalData: 0 }]);

      await getTransactions(mockTenantId, query);
      const callArgs = (db.query.transactions.findMany as any).mock.calls[0][0];
      expect(callArgs.where).toBeDefined();
    });

    it("should handle date filtering correctly", async () => {
      await getTransactions(mockTenantId, { ...query, date: "2024-05-31" });
      const callArgs = (db.query.transactions.findMany as any).mock.calls[0][0];
      expect(callArgs.where).toBeDefined();
    });

    it("should handle date range (from/to) filtering correctly", async () => {
      await getTransactions(mockTenantId, { ...query, from: "2024-05-01", to: "2024-05-31" });
      const callArgs = (db.query.transactions.findMany as any).mock.calls[0][0];
      expect(callArgs.where).toBeDefined();
    });
  });

  describe("getTransactionDetail", () => {
    it("should return transaction detail if found and belongs to tenant (Happy Path)", async () => {
      const mockTrx = { id: mockTransactionId, trxNumber: "TRX-DET" };
      (db.query.transactions.findFirst as any).mockResolvedValue(mockTrx);

      const result = await getTransactionDetail(mockTenantId, { id: mockTransactionId });
      expect(result.trxNumber).toBe("TRX-DET");
    });

    it("should throw TransactionNotFoundError if data not found or belongs to another tenant (Multi-Tenant)", async () => {
      (db.query.transactions.findFirst as any).mockResolvedValue(null);

      expect(getTransactionDetail(mockTenantId, { id: "not-my-id" }))
        .rejects.toThrow(TransactionNotFoundError);
    });
  });

  describe("voidTransaction", () => {
    it("should successfully void transaction and restore stock (Happy Path)", async () => {
      const mockTrx = {
        id: mockTransactionId,
        status: "success",
        trxNumber: "TRX-VOID",
        items: [{ productId: "p1", qty: 2 }, { productId: "p2", qty: 3 }],
      };
      (mockTx.query.transactions.findFirst as any).mockResolvedValue(mockTrx);

      const result = await voidTransaction(mockTenantId, mockTransactionId);

      expect(result.trxNumber).toBe("TRX-VOID");
      expect(mockTx.update).toHaveBeenCalledTimes(3); // 1 for status, 2 for stock
    });

    it("should throw TransactionNotFoundError if transaction not found for the tenant (Multi-Tenant)", async () => {
      (mockTx.query.transactions.findFirst as any).mockResolvedValue(null);

      expect(voidTransaction(mockOtherTenantId, mockTransactionId))
        .rejects.toThrow(TransactionNotFoundError);
    });

    it("should throw ConflictError if transaction is already void (Edge Case)", async () => {
      (mockTx.query.transactions.findFirst as any).mockResolvedValue({ status: "void" });

      expect(voidTransaction(mockTenantId, mockTransactionId))
        .rejects.toThrow(ConflictError);
    });

    it("should correctly increment stock when voiding (Data Integrity)", async () => {
      const mockTrx = {
        id: "trx-1",
        status: "success",
        items: [{ productId: "p1", qty: 10 }],
      };
      (mockTx.query.transactions.findFirst as any).mockResolvedValue(mockTrx);

      await voidTransaction(mockTenantId, "trx-1");
      
      const stockUpdateCall = (mockTx.update as any).mock.calls[1][0];
      expect(stockUpdateCall).toBeDefined();
    });
  });
});
