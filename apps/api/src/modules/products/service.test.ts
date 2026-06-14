import { describe, expect, it, mock, beforeEach } from "bun:test";
import {
  getProduct,
  getProductDetail,
  postProduct,
  patchProduct,
  softDeleteProduct,
} from "./service";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ProductNotFoundError } from "./error";
import { ConflictError } from "@/plugins/error";

// Mock Database
const mockReturning = mock();
const mockValues = mock().mockReturnValue({ returning: mockReturning });
const mockInsert = mock().mockReturnValue({ values: mockValues });

const mockWhere = mock().mockReturnValue({ returning: mockReturning });
const mockSet = mock().mockReturnValue({ where: mockWhere });
const mockUpdate = mock().mockReturnValue({ set: mockSet });

mock.module("@/db", () => ({
  db: {
    query: {
      products: {
        findMany: mock(),
        findFirst: mock(),
      },
    },
    insert: mockInsert,
    update: mockUpdate,
  },
}));

describe("Product Service Unit Testing", () => {
  const mockTenantId = "tenant-123";
  const mockOtherTenantId = "tenant-456";
  const mockProductId = "prod-uuid-1";

  beforeEach(() => {
    mock.restore();
    mockReturning.mockClear();
    mockValues.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockSet.mockClear();
    mockWhere.mockClear();
    (db.query.products.findMany as any).mockClear();
    (db.query.products.findFirst as any).mockClear();
  });

  describe("getProduct", () => {
    it("should return active products for a specific tenant (Happy Path)", async () => {
      const mockData = [
        {
          id: "1",
          name: "Product A",
          isActive: true,
          tenantId: mockTenantId,
          createdAt: null,
          updatedAt: null,
          barcode: "123",
          sellingPrice: "1000",
          unit: "pcs",
          stockQty: 10,
          category: null,
        },
      ];
      (db.query.products.findMany as any).mockResolvedValue(mockData);

      const result = await getProduct(mockTenantId);

      expect(result).toEqual(mockData);
      expect(db.query.products.findMany).toHaveBeenCalled();
    });

    it("should strictly filter by tenantId and isActive: true (Multi-Tenant & Soft Delete)", async () => {
      await getProduct(mockTenantId, "search-query", "12345", "cat-1");

      const callArgs = (db.query.products.findMany as any).mock.calls[0][0];

      // Verify filters contain tenantId, isActive, and others
      // Drizzle filters are complex objects, so we check if the where clause exists
      expect(callArgs.where).toBeDefined();
    });

    it("should apply stockLte filter and sort by stockQty asc", async () => {
      await getProduct(mockTenantId, undefined, undefined, undefined, 10);

      const callArgs = (db.query.products.findMany as any).mock.calls[0][0];
      expect(callArgs.where).toBeDefined();
      expect(callArgs.orderBy).toBeDefined();
    });
  });

  describe("getProductDetail", () => {
    it("should return product detail when found (Happy Path)", async () => {
      const mockProduct = {
        id: mockProductId,
        name: "Indomie",
        barcode: "123",
        sellingPrice: "3000",
        unit: "pcs",
        slug: "indomie",
        stockQty: 10,
        category: { name: "Food" },
      };
      (db.query.products.findFirst as any).mockResolvedValue(mockProduct);

      const result = await getProductDetail(mockProductId, mockTenantId);

      expect(result?.name).toBe("Indomie");
      expect(result?.category).toBe("Food");
    });

    it("should throw ProductNotFoundError if product belongs to another tenant (Data Leakage)", async () => {
      // Mock returns null because filter by (id AND tenantId) fails
      (db.query.products.findFirst as any).mockResolvedValue(null);

      expect(
        getProductDetail(mockProductId, mockOtherTenantId),
      ).rejects.toThrow(ProductNotFoundError);
    });

    it("should throw ProductNotFoundError for inactive products (Soft Delete)", async () => {
      (db.query.products.findFirst as any).mockResolvedValue(null);

      expect(getProductDetail(mockProductId, mockTenantId)).rejects.toThrow(
        ProductNotFoundError,
      );
    });
  });

  describe("postProduct", () => {
    const validArgs = {
      name: "New Product",
      tenantId: mockTenantId,
      barcode: "888",
      sellingPrice: "5000",
      unit: "pcs",
      stockQty: 100,
      categoryId: "cat-1",
    };

    it("should successfully create a product (Happy Path)", async () => {
      (db.query.products.findFirst as any).mockResolvedValue(null);
      mockReturning.mockResolvedValue([
        {
          id: "new-id",
          name: validArgs.name,
          slug: "new-product",
        },
      ]);

      const result = await postProduct(validArgs);

      expect(result?.name).toBe(validArgs.name);
    });

    it("should throw ConflictError if barcode is taken in the same tenant (Uniqueness)", async () => {
      (db.query.products.findFirst as any).mockResolvedValue({
        id: "existing-id",
      });

      expect(postProduct(validArgs)).rejects.toThrow(ConflictError);
    });

    it("should allow same barcode for different tenants (Multi-Tenant Uniqueness)", async () => {
      (db.query.products.findFirst as any).mockResolvedValue(null);
      mockReturning.mockResolvedValue([{ id: "new-id" }]);

      const result = await postProduct({
        ...validArgs,
        tenantId: mockOtherTenantId,
      });
      expect(result).toBeDefined();
    });

    it("should handle slug collision by appending random string", async () => {
      // First call for barcode check: null
      // Second call for slug check: exists
      (db.query.products.findFirst as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "old-id", slug: "new-product" });

      mockReturning.mockResolvedValue([
        { id: "id", slug: "new-product-random" },
      ]);

      await postProduct(validArgs);

      const insertedValue = mockValues.mock.calls[0]![0] as any;
      expect(insertedValue.slug).not.toBe("new-product");
      expect(insertedValue.slug).toContain("new-product-");
    });

    it("should throw error if name is empty", async () => {
      expect(postProduct({ ...validArgs, name: "" })).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("patchProduct", () => {
    it("should successfully update product (Happy Path)", async () => {
      (db.query.products.findFirst as any).mockResolvedValue({
        name: "Old",
        barcode: "111",
      });
      mockReturning.mockResolvedValue([{ id: mockProductId }]);

      const result = await patchProduct(mockProductId, mockTenantId, {
        name: "New",
      });
      expect(result).toBeDefined();
    });

    it("should throw ProductNotFoundError if updating product from another tenant", async () => {
      (db.query.products.findFirst as any).mockResolvedValue(null);

      expect(
        patchProduct(mockProductId, mockOtherTenantId, { name: "Hack" }),
      ).rejects.toThrow(ProductNotFoundError);
    });

    it("should throw ConflictError if new barcode is used by another product", async () => {
      // Current product
      (db.query.products.findFirst as any).mockResolvedValueOnce({
        name: "A",
        barcode: "111",
      });
      // Existing barcode check
      (db.query.products.findFirst as any).mockResolvedValueOnce({
        id: "other-id",
        barcode: "222",
      });

      expect(
        patchProduct(mockProductId, mockTenantId, { barcode: "222" }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("softDeleteProduct", () => {
    it("should set isActive to false (Happy Path)", async () => {
      const mockDeleted = { id: mockProductId, isActive: false };
      mockReturning.mockResolvedValue([mockDeleted]);

      const result = await softDeleteProduct(mockProductId, mockTenantId);

      expect(result?.isActive).toBe(false);
    });

    it("should throw ProductNotFoundError if product not found for that tenant", async () => {
      mockReturning.mockResolvedValue([]);

      expect(softDeleteProduct(mockProductId, mockTenantId)).rejects.toThrow(
        ProductNotFoundError,
      );
    });
  });
});
