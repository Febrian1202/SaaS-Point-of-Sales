import { describe, it, expect, mock, beforeEach } from "bun:test";
import * as service from "./service";
import { db } from "@db";
import { ConflictError, RegisterError, SessionError } from "@plugin";
import { UserNotFoundError } from "./error";

// Setup mocks for Drizzle DB and multi-tenant logic
const mockReturning = mock();
const mockWhere = mock().mockReturnValue({ returning: mockReturning });
const mockSet = mock().mockReturnValue({ where: mockWhere });
const mockUpdate = mock().mockReturnValue({ set: mockSet });

const mockInsertReturning = mock();
const mockInsertValues = mock().mockReturnValue({
  returning: mockInsertReturning,
});
const mockInsert = mock().mockReturnValue({ values: mockInsertValues });

mock.module("@db", () => ({
  db: {
    query: {
      users: {
        findFirst: mock(),
        findMany: mock(),
      },
    },
    insert: mockInsert,
    update: mockUpdate,
  },
}));

// Mock password hashing to avoid bcrypt overhead during tests
Bun.password.hash = mock(async () => "$2b$10$mockedhashedpassword");

describe("Users Service Unit Tests", () => {
  const TENANT_A = "tenant-uuid-111";
  const TENANT_B = "tenant-uuid-222";
  const CASHIER_ID = "cashier-uuid-888";

  beforeEach(() => {
    mockReturning.mockClear();
    mockInsertReturning.mockClear();
    (db.query.users.findFirst as any).mockClear();
    (db.query.users.findMany as any).mockClear();
  });

  describe("registerCashier", () => {
    const validData = {
      name: "John Doe",
      email: "john@store.com",
      password: "password123",
    };

    it("should register a new cashier successfully (Happy Path)", async () => {
      (db.query.users.findFirst as any).mockResolvedValue(null);
      mockInsertReturning.mockResolvedValue([
        {
          id: CASHIER_ID,
          name: validData.name,
          email: validData.email,
          role: "cashier",
          tenantId: TENANT_A,
        },
      ]);

      const result = await service.registerCashier(TENANT_A, validData);

      expect(result.id).toBe(CASHIER_ID);
      expect(result.role).toBe("cashier");
      expect(Bun.password.hash).toHaveBeenCalled();
    });

    it("should throw ConflictError if email is already used anywhere (Cross-Tenant Uniqueness)", async () => {
      (db.query.users.findFirst as any).mockResolvedValue({
        id: "existing-id",
        email: validData.email,
      });

      expect(service.registerCashier(TENANT_A, validData)).rejects.toThrow(
        ConflictError,
      );
    });

    it("should throw RegisterError if database insertion returns empty (DB Failure Edge Case)", async () => {
      (db.query.users.findFirst as any).mockResolvedValue(null);
      mockInsertReturning.mockResolvedValue([]);

      expect(service.registerCashier(TENANT_A, validData)).rejects.toThrow(
        RegisterError,
      );
    });
  });

  describe("getCashier", () => {
    it("should return only active cashiers for the specific tenant (Multi-Tenant & Soft Delete)", async () => {
      const mockData = [
        { id: "1", tenantId: TENANT_A, role: "cashier", isActive: true },
      ];
      (db.query.users.findMany as any).mockResolvedValue(mockData);

      const result = await service.getCashier(TENANT_A);

      expect(result).toHaveLength(1);
      expect(result[0]?.tenantId).toBe(TENANT_A);
      expect(result[0]?.role).toBe("cashier");
    });

    it("should return empty array if tenant has no cashiers", async () => {
      (db.query.users.findMany as any).mockResolvedValue([]);
      const result = await service.getCashier(TENANT_A);
      expect(result).toHaveLength(0);
    });
  });

  describe("getUser", () => {
    it("should return active user profile (Happy Path)", async () => {
      (db.query.users.findFirst as any).mockResolvedValue({
        id: CASHIER_ID,
        isActive: true,
      });
      const result = await service.getUser(CASHIER_ID);
      expect(result.id).toBe(CASHIER_ID);
    });

    it("should throw SessionError if user is inactive (Soft Delete Edge Case)", async () => {
      (db.query.users.findFirst as any).mockResolvedValue(null);
      expect(service.getUser(CASHIER_ID)).rejects.toThrow(SessionError);
    });
  });

  describe("updateCashier", () => {
    const updateData = {
      name: "Jane Updated",
      email: "jane@upd.com",
      password: "newpassword",
    };

    it("should update cashier and re-hash password (Happy Path)", async () => {
      mockReturning.mockResolvedValue([
        { id: CASHIER_ID, ...updateData, tenantId: TENANT_A },
      ]);

      const result = await service.updateCashier(
        CASHIER_ID,
        TENANT_A,
        updateData,
      );
      expect(result.name).toBe("Jane Updated");
      expect(Bun.password.hash).toHaveBeenCalled();
    });

    it("should throw UserNotFoundError if attempting to update user in another tenant (Multi-Tenant Security)", async () => {
      mockReturning.mockResolvedValue([]);

      expect(
        service.updateCashier(CASHIER_ID, TENANT_B, updateData),
      ).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("deleteCashier", () => {
    it("should set isActive to false and return deleted cashier ID (Soft Delete)", async () => {
      mockReturning.mockResolvedValue([{ id: CASHIER_ID }]);

      const result = await service.deleteCashier(CASHIER_ID, TENANT_A);
      expect(result.id).toBe(CASHIER_ID);
    });

    it("should throw UserNotFoundError for invalid ID or tenant mismatch (ID Manipulation)", async () => {
      mockReturning.mockResolvedValue([]);

      expect(service.deleteCashier("fake-id", TENANT_A)).rejects.toThrow(
        UserNotFoundError,
      );
    });
  });

  describe("updateOwnProfile", () => {
    it("should allow profile update for the logged-in cashier (Happy Path)", async () => {
      mockReturning.mockResolvedValue([
        { id: CASHIER_ID, name: "Self Updated" },
      ]);

      const result = await service.updateOwnProfile(CASHIER_ID, TENANT_A, {
        name: "Self Updated",
      });
      expect(result.name).toBe("Self Updated");
    });

    it("should throw UserNotFoundError if profile doesn't exist or role is not cashier (RBAC check)", async () => {
      mockReturning.mockResolvedValue([]);

      expect(
        service.updateOwnProfile(CASHIER_ID, TENANT_A, { name: "Hack" }),
      ).rejects.toThrow(UserNotFoundError);
    });

    it("should properly hash password when updating own profile", async () => {
      mockReturning.mockResolvedValue([{ id: CASHIER_ID, name: "X" }]);

      await service.updateOwnProfile(CASHIER_ID, TENANT_A, {
        name: "X",
        password: "new",
      });
      expect(Bun.password.hash).toHaveBeenCalled();
    });
  });
});
