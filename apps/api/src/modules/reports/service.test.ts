import { describe, it, expect, mock, beforeEach } from "bun:test";
import { getDailySummary, getMonthlySummary } from "./service";
import { db } from "@db";
import { ConflictError } from "@/plugins";

mock.module("@db", () => ({
  db: {
    query: {
      dailySummaries: {
        findFirst: mock(),
      },
    },
    select: mock(),
    insert: mock(),
  },
}));

describe("Reports Service - getDailySummary", () => {
  const mockTenantId = "77f9999a-4713-431f-993d-d42173167b73";
  const mockOtherTenantId = "00000000-0000-0000-0000-000000000000";
  const mockQuery = { date: "2024-05-31" };

  beforeEach(() => {
    mock.restore();
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
      generatedAt: new Date()
    };
    (db.query.dailySummaries.findFirst as any).mockResolvedValue(cachedData);

    const result = await getDailySummary(mockTenantId, mockQuery);

    expect(result).toEqual(cachedData);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("Happy Path: Should calculate and save new summary if cache miss", async () => {
    (db.query.dailySummaries.findFirst as any).mockResolvedValue(null);
    
    // Mock Retail Result
    const mockRetail = [{ totalRevenue: "100000", totalTrx: 10 }];
    const retailWhere = mock(() => ({ where: mock(() => Promise.resolve(mockRetail)) }));
    const retailFrom = mock(() => ({ from: retailWhere }));
    
    // Mock Brilink Result
    const mockBrilink = [{ totalCommission: "5000", totalTrx: 5 }];
    const brilinkWhere = mock(() => ({ where: mock(() => Promise.resolve(mockBrilink)) }));
    const brilinkFrom = mock(() => ({ from: brilinkWhere }));

    (db.select as any)
      .mockImplementationOnce(() => ({ from: retailFrom }))
      .mockImplementationOnce(() => ({ from: brilinkFrom }));

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
      generatedAt: new Date()
    };
    const insertReturning = mock(() => Promise.resolve([mockNewSummary]));
    const insertValues = mock(() => ({ returning: insertReturning }));
    (db.insert as any).mockImplementation(() => ({ values: insertValues }));

    const result = await getDailySummary(mockTenantId, mockQuery);

    expect(result).toEqual(mockNewSummary);
    expect(db.insert).toHaveBeenCalled();
  });

  it("Edge Case: Multi-tenant isolation (Zero results for different tenant)", async () => {
    (db.query.dailySummaries.findFirst as any).mockResolvedValue(null);
    
    const mockEmpty = [{ totalRevenue: null, totalTrx: 0 }];
    const emptyWhere = mock(() => ({ where: mock(() => Promise.resolve(mockEmpty)) }));
    (db.select as any).mockImplementation(() => ({ from: () => ({ from: emptyWhere }) }));

    const insertReturning = mock(() => Promise.resolve([{ totalRevenue: "0", trxCount: 0 }]));
    (db.insert as any).mockImplementation(() => ({ values: () => ({ returning: insertReturning }) }));

    const result = await getDailySummary(mockOtherTenantId, mockQuery);

    expect(Number(result?.totalRevenue)).toBe(0);
  });

  it("Edge Case: Handle Race Condition (Unique Constraint 23505)", async () => {
    (db.query.dailySummaries.findFirst as any).mockResolvedValueOnce(null); // First check
    
    // Mock calculation queries
    (db.select as any).mockImplementation(() => ({ 
      from: () => ({ from: { where: () => Promise.resolve([{ totalRevenue: "10", totalTrx: 1 }]) } }) 
    }));

    // Mock Insert failure
    const error23505 = new Error("Unique violation");
    (error23505 as any).code = "23505";
    (db.insert as any).mockImplementation(() => ({ 
      values: () => ({ returning: () => Promise.reject(error23505) }) 
    }));

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
    (db.select as any).mockImplementation(() => ({ 
      from: () => ({ from: { where: () => Promise.resolve([]) } }) 
    }));

    (db.insert as any).mockImplementation(() => ({ 
      values: () => ({ returning: () => Promise.reject(new Error("DB Down")) }) 
    }));

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

    const mockWhere = mock(() => Promise.resolve(mockAggregated));
    const mockFrom = mock(() => ({ where: mockWhere }));
    (db.select as any).mockImplementation(() => ({ from: mockFrom }));

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

    const mockWhere = mock(() => Promise.resolve(mockEmpty));
    (db.select as any).mockImplementation(() => ({ from: () => ({ where: mockWhere }) }));

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

    const mockWhere = mock(() => Promise.resolve(mockLargeData));
    (db.select as any).mockImplementation(() => ({ from: () => ({ where: mockWhere }) }));

    const result = await getMonthlySummary(mockTenantId, mockQuery);

    expect(result.retailRevenue).toBe(999999999.99);
    expect(result.retailCogs).toBe(0.01);
  });
});
