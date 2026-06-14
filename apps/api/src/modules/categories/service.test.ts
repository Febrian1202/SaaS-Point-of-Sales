import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  getCategory,
  getCategoryDetail,
  postCategory,
  updateCategory,
  deleteCategory,
} from "./service";
import { db } from "@/db";
import { CategoryNotFoundError } from "./error";
import { ConflictError } from "@/plugins";

mock.module("@/db", () => ({
  db: {
    query: {
      categories: {
        findMany: mock(),
        findFirst: mock(),
      },
      products: {
        findFirst: mock(),
      },
    },
    insert: mock(),
    update: mock(),
    delete: mock(),
  },
}));

describe("Category Service - Unit Testing", () => {
  const mockTenantId = "8f682d46-419b-449e-9d29-c09e3a62888c";
  const mockCategoryId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    mock.restore();
    (db.insert as any).mockClear();
    (db.update as any).mockClear();
    (db.delete as any).mockClear();
  });

  describe("getCategory", () => {
    it("Happy Path: should return list of categories for specific tenant", async () => {
      const mockData = [
        {
          id: "1",
          name: "Food",
          slug: "food",
          createdAt: null,
          updatedAt: null,
        },
      ];
      (db.query.categories.findMany as any).mockResolvedValue(mockData);

      const result = await getCategory(mockTenantId);

      expect(result).toEqual(mockData);
      expect(db.query.categories.findMany).toHaveBeenCalled();
    });

    it("Edge Case: should apply search filter correctly", async () => {
      await getCategory(mockTenantId, "Snack");
      const callArgs = (db.query.categories.findMany as any).mock.calls[0][0];

      expect(callArgs.where).toBeDefined();
    });

    it("Edge Case: should only return data for the requested tenantId (Isolation)", async () => {
      await getCategory(mockTenantId);
      const callArgs = (db.query.categories.findMany as any).mock.calls[0][0];

      expect(callArgs.where).toBeDefined();
    });
  });

  describe("getCategoryDetail", () => {
    it("Happy Path: should return category detail if exists", async () => {
      const mockData = {
        id: mockCategoryId,
        name: "Drink",
        slug: "drink",
        createdAt: null,
        updatedAt: null,
        tenantId: mockTenantId,
      };
      (db.query.categories.findFirst as any).mockResolvedValue(mockData);

      const result = await getCategoryDetail(mockCategoryId, mockTenantId);

      expect(result).toEqual(mockData);
    });

    it("Edge Case: should throw CategoryNotFoundError if ID does not exist", async () => {
      (db.query.categories.findFirst as any).mockResolvedValue(null);

      expect(getCategoryDetail(mockCategoryId, mockTenantId)).rejects.toThrow(
        CategoryNotFoundError,
      );
    });

    it("Edge Case: should throw CategoryNotFoundError if ID exists but belongs to different tenant (Data Leakage Protection)", async () => {
      (db.query.categories.findFirst as any).mockResolvedValue(null);

      expect(
        getCategoryDetail(mockCategoryId, "wrong-tenant-id"),
      ).rejects.toThrow(CategoryNotFoundError);
    });
  });

  describe("postCategory", () => {
    it("Happy Path: should create a new category and return slugified name", async () => {
      (db.query.categories.findFirst as any).mockResolvedValue(null);
      (db.insert as any).mockReturnValue({
        values: mock(() => ({
          returning: mock(() => [
            { id: "new-id", name: "Fresh Milk", slug: "fresh-milk" },
          ]),
        })),
      });

      const result = await postCategory("Fresh Milk", mockTenantId);

      expect(result?.slug).toBe("fresh-milk");
      expect(db.insert).toHaveBeenCalled();
    });

    it("Edge Case: should throw ConflictError if category name already exists in same tenant", async () => {
      (db.query.categories.findFirst as any).mockResolvedValue({
        name: "Food",
      });

      expect(postCategory("Food", mockTenantId)).rejects.toThrow(ConflictError);
    });

    it("Edge Case: should allow same category name if in different tenant", async () => {
      (db.query.categories.findFirst as any).mockResolvedValue(null);
      (db.insert as any).mockReturnValue({
        values: mock(() => ({
          returning: mock(() => [{ id: "new-id", name: "Food", slug: "food" }]),
        })),
      });

      const result = await postCategory("Food", "other-tenant-id");
      expect(result?.name).toBe("Food");
    });
  });

  describe("updateCategory", () => {
    it("Happy Path: should update category name and slug", async () => {
      (db.query.categories.findFirst as any)
        .mockResolvedValueOnce({ name: "Old Name" }) // currentCategory
        .mockResolvedValueOnce(null); // existingCategory check

      (db.update as any).mockReturnValue({
        set: mock(() => ({
          where: mock(() => ({
            returning: mock(() => [
              { id: mockCategoryId, name: "New Name", slug: "new-name" },
            ]),
          })),
        })),
      });

      const result = await updateCategory(mockCategoryId, mockTenantId, {
        name: "New Name",
      });

      expect(result?.slug).toBe("new-name");
    });

    it("Edge Case: should throw ConflictError when updating to a name that already exists in that tenant", async () => {
      (db.query.categories.findFirst as any)
        .mockResolvedValueOnce({ name: "Old Name" })
        .mockResolvedValueOnce({ name: "Existing Name" });

      expect(
        updateCategory(mockCategoryId, mockTenantId, { name: "Existing Name" }),
      ).rejects.toThrow(ConflictError);
    });

    it("Edge Case: should throw CategoryNotFoundError when updating non-existent category", async () => {
      (db.query.categories.findFirst as any).mockResolvedValue(null);

      expect(
        updateCategory("invalid-id", mockTenantId, { name: "New" }),
      ).rejects.toThrow(CategoryNotFoundError);
    });
  });

  describe("deleteCategory", () => {
    it("Happy Path: should delete category if it has no associated products", async () => {
      (db.query.categories.findFirst as any).mockResolvedValue({
        id: mockCategoryId,
        name: "Unused",
      });
      (db.query.products.findFirst as any).mockResolvedValue(null);
      (db.delete as any).mockReturnValue({
        where: mock(() => Promise.resolve()),
      });

      await deleteCategory(mockCategoryId, mockTenantId);

      expect(db.delete).toHaveBeenCalled();
    });

    it("Edge Case: should throw ConflictError if category is still used by products (Relational Integrity)", async () => {
      (db.query.categories.findFirst as any).mockResolvedValue({
        id: mockCategoryId,
        name: "Used",
      });
      (db.query.products.findFirst as any).mockResolvedValue({ id: "prod-1" });

      expect(deleteCategory(mockCategoryId, mockTenantId)).rejects.toThrow(
        ConflictError,
      );
    });

    it("Edge Case: should throw CategoryNotFoundError if trying to delete from wrong tenant", async () => {
      (db.query.categories.findFirst as any).mockResolvedValue(null);

      expect(
        deleteCategory(mockCategoryId, "hacker-tenant-id"),
      ).rejects.toThrow(CategoryNotFoundError);
    });

    it("Edge Case: should not allow deletion of category even if it exists in DB but not for this tenant", async () => {
      (db.query.categories.findFirst as any).mockResolvedValue(null);

      await expect(
        deleteCategory(mockCategoryId, mockTenantId),
      ).rejects.toThrow(CategoryNotFoundError);
      expect(db.delete).not.toHaveBeenCalled();
    });
  });
});
