import { describe, it, expect, mock, beforeEach } from "bun:test";
import { getDailySummary, getMonthlySummary, getDailyRangeSummary } from "./service";
import { db } from "@db";
import { ConflictError } from "@/plugins";
import { InvalidDateRangeError } from "./error";

// Mock Database
const mockWhere = mock();
const mockInnerJoin = mock().mockReturnValue({ where: mockWhere });
const mockFrom = mock().mockImplementation(() => ({
  where: mockWhere,
  innerJoin: mockInnerJoin,
}));
const mockSelect = mock().mockReturnValue({ from: mockFrom });

const mockReturning = mock();
const mockValues = mock().mockReturnValue({ returning: mockReturning });
const mockInsert = mock().mockReturnValue({ values: mockValues });

mock.module("@db", () => ({
  db: {
    query: {
      dailySummaries: {
        findFirst: mock(),
        findMany: mock(),
      },
    },
    select: mockSelect,
    insert: mockInsert,
  },
}));

describe("Reports Service - getDailySummary", () => {
  const mockTenantId = "77f9999a-4713-431f-993d-d42173167b73";
  const mockOtherTenantId = "00000000-0000-0000-0000-000000000000";
  const mockQuery = { date: "2024-05-31" };

  beforeEach(() => {
    mock.restore();
    mockWhere.mockClear();
    mockInnerJoin.mockClear();
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockReturning.mockClear();
    mockValues.mockClear();
    mockInsert.mockClear();
    (db.query.dailySummaries.findFirst as any).mockClear();
    (db.query.dailySummaries.findMany as any).mockClear();
  });

  it("Happy Path: Should return cached summary if exists", async () => {
    const cachedData = { 
      id: "1", 
      tenantId: mockTenantId, 
      summaryDate: "2024-05-31", 
      totalRevenue: "50000",
      retailRevenue: "45000",
      retailCogs: "30000",
      brilinkCommission: "5000",
      grossProfit: "15000",
      trxCount: 10,
      itemsSold: null,
      generatedAt: new Date()
    };
    (db.query.dailySummaries.findFirst as any).mockResolvedValue(cachedData);

    const result = await getDailySummary(mockTenantId, mockQuery);

    expect(result).toEqual(cachedData);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("Happy Path: Should calculate and save new summary if cache miss", async () => {
    (db.query.dailySummaries.findFirst as any).mockResolvedValue(null);
    
    // Mock Retail, Items Sold, & Brilink Result
    mockWhere
      .mockResolvedValueOnce([{ totalRevenue: "100000", totalTrx: 10 }])
      .mockResolvedValueOnce([{ totalItemsSold: "15" }])
      .mockResolvedValueOnce([{ totalCommission: "5000", totalTrx: 5 }]);

    const mockNewSummary = { 
      id: "2", 
      tenantId: mockTenantId,
      summaryDate: "2024-05-31",
      retailRevenue: "100000",
      retailCogs: "80000",
      brilinkCommission: "5000",
      totalRevenue: "105000", 
      grossProfit: "25000",
      trxCount: 15,
      itemsSold: 15,
      generatedAt: new Date()
    };
    mockReturning.mockResolvedValue([mockNewSummary]);

    const result = await getDailySummary(mockTenantId, mockQuery);

    expect(result).toEqual(mockNewSummary);
    expect(db.insert).toHaveBeenCalled();
  });

  it("Edge Case: Multi-tenant isolation (Zero results for different tenant)", async () => {
    (db.query.dailySummaries.findFirst as any).mockResolvedValue(null);
    
    mockWhere.mockResolvedValue([{ totalRevenue: null, totalTrx: 0 }]);
    mockReturning.mockResolvedValue([{ totalRevenue: "0", trxCount: 0 }]);

    const result = await getDailySummary(mockOtherTenantId, mockQuery);

    expect(Number(result?.totalRevenue)).toBe(0);
  });

  it("Edge Case: Handle Race Condition (Unique Constraint 23505)", async () => {
    (db.query.dailySummaries.findFirst as any).mockResolvedValueOnce(null); // First check
    
    // Mock calculation queries
    mockWhere.mockResolvedValue([{ totalRevenue: "10", totalTrx: 1 }]);

    // Mock Insert failure
    const error23505 = new Error("Unique violation");
    (error23505 as any).code = "23505";
    mockReturning.mockRejectedValue(error23505);

    const retrySummary = { 
      id: "99", 
      summaryDate: "2024-05-31",
      tenantId: mockTenantId,
      retailRevenue: "10",
      retailCogs: "5",
      brilinkCommission: "0",
      totalRevenue: "10",
      grossProfit: "5",
      trxCount: 1,
      generatedAt: new Date()
    };
    (db.query.dailySummaries.findFirst as any).mockResolvedValueOnce(retrySummary); // Second check in catch

    const result = await getDailySummary(mockTenantId, mockQuery);

    expect(result).toEqual(retrySummary);
    expect(db.query.dailySummaries.findFirst).toHaveBeenCalledTimes(2);
  });

  it("Edge Case: Throw ConflictError on generic database failure", async () => {
    (db.query.dailySummaries.findFirst as any).mockResolvedValue(null);
    mockWhere.mockResolvedValue([]);
    mockReturning.mockRejectedValue(new Error("DB Down"));

    expect(getDailySummary(mockTenantId, mockQuery)).rejects.toThrow(ConflictError);
  });
});

describe("Reports Service - getMonthlySummary", () => {
  const mockTenantId = "77f9999a-4713-431f-993d-d42173167b73";
  const mockQuery = { month: "2024-05" };

  it("Happy Path: Should aggregate daily summaries for the month", async () => {
    const mockAggregated = [{
      totalRetailRevenue: "1000000",
      totalRetailCogs: "800000",
      totalBrilinkCommission: "50000",
      grandTotalRevenue: "1050000",
      grandTotalProfit: "250000",
      totalTrxCount: "150"
    }];

    mockWhere.mockResolvedValue(mockAggregated);

    const result = await getMonthlySummary(mockTenantId, mockQuery);

    expect(result.month).toBe("2024-05");
    expect(result.retailRevenue).toBe(1000000);
    expect(result.grossProfit).toBe(250000);
    expect(result.trxCount).toBe(150);
  });

  it("Edge Case: Should return zero values if no daily summaries found", async () => {
    const mockEmpty = [{
      totalRetailRevenue: null,
      totalRetailCogs: null,
      totalBrilinkCommission: null,
      grandTotalRevenue: null,
      grandTotalProfit: null,
      totalTrxCount: null
    }];

    mockWhere.mockResolvedValue(mockEmpty);

    const result = await getMonthlySummary(mockTenantId, mockQuery);

    expect(result.retailRevenue).toBe(0);
    expect(result.totalRevenue).toBe(0);
    expect(result.trxCount).toBe(0);
  });

  it("Edge Case: Numeric precision check (Handle large numbers/floats)", async () => {
    const mockLargeData = [{
      totalRetailRevenue: "999999999.99",
      totalRetailCogs: "0.01",
      totalBrilinkCommission: "0",
      grandTotalRevenue: "999999999.99",
      grandTotalProfit: "999999999.98",
      totalTrxCount: "999999"
    }];

    mockWhere.mockResolvedValue(mockLargeData);

    const result = await getMonthlySummary(mockTenantId, mockQuery);

    expect(result.retailRevenue).toBe(999999999.99);
    expect(result.retailCogs).toBe(0.01);
  });
});

describe("Reports Service - getDailyRangeSummary", () => {
  const mockTenantId = "77f9999a-4713-431f-993d-d42173167b73";

  it("Happy Path: Should return daily range reports from cache if they exist", async () => {
    const cachedData = [
      {
        id: "1",
        tenantId: mockTenantId,
        summaryDate: "2026-06-06",
        retailRevenue: "1800000.00",
        brilinkCommission: "90000.00",
        trxCount: 28,
        generatedAt: new Date()
      },
      {
        id: "2",
        tenantId: mockTenantId,
        summaryDate: "2026-06-07",
        retailRevenue: "2100000.00",
        brilinkCommission: "110000.00",
        trxCount: 31,
        generatedAt: new Date()
      }
    ];

    (db.query.dailySummaries.findFirst as any).mockClear();
    (db.query.dailySummaries.findMany as any).mockResolvedValue(cachedData);

    const result = await getDailyRangeSummary(mockTenantId, { from: "2026-06-06", to: "2026-06-07" });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      date: "2026-06-06",
      retailRevenue: 1800000,
      brilinkCommission: 90000,
      trxCount: 28,
    });
    expect(result[1]).toEqual({
      date: "2026-06-07",
      retailRevenue: 2100000,
      brilinkCommission: 110000,
      trxCount: 31,
    });
    expect(db.query.dailySummaries.findFirst).not.toHaveBeenCalled();
  });

  it("Edge Case: Should throw InvalidDateRangeError if 'to' is before 'from'", async () => {
    expect(
      getDailyRangeSummary(mockTenantId, { from: "2026-06-07", to: "2026-06-06" })
    ).rejects.toThrow(InvalidDateRangeError);
  });

  it("Edge Case: Should throw InvalidDateRangeError if range is > 31 days", async () => {
    expect(
      getDailyRangeSummary(mockTenantId, { from: "2026-06-01", to: "2026-07-03" })
    ).rejects.toThrow(InvalidDateRangeError);
  });
});
