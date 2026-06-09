import { mock, describe, it, expect, beforeEach, beforeAll } from "bun:test";
import { Elysia } from "elysia";

const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
const mockTenantId = "8f682d46-419b-449e-9d29-c09e3a62888c";
const mockCategoryId = "550e8400-e29b-41d4-a716-446655440004";

const validCategory = {
  id: mockCategoryId,
  name: "Mock Category",
  slug: "mock-category",
  tenantId: mockTenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Category Routes", () => {
  let app: Elysia;
  let service: any;

  beforeAll(async () => {
    mock.module("./service", () => ({
      getCategory: mock(),
      getCategoryDetail: mock(),
      postCategory: mock(),
      updateCategory: mock(),
      deleteCategory: mock(),
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

    const { categoriesRoutes } = await import("./route");
    app = new Elysia().use(categoriesRoutes);
    service = await import("./service");
  });

  beforeEach(() => {
    mock.restore();
  });

  const headers = { 
    "Authorization": "Bearer mock-token",
    "Content-Type": "application/json"
  };

  it("GET /category should return 200", async () => {
    service.getCategory.mockResolvedValue([validCategory]);
    const response = await app.handle(new Request("http://localhost/category", { headers }));
    expect(response.status).toBe(200);
  });

  it("GET /category/:id should return 200", async () => {
    service.getCategoryDetail.mockResolvedValue(validCategory);
    const response = await app.handle(new Request(`http://localhost/category/${mockCategoryId}`, { headers }));
    expect(response.status).toBe(200);
  });

  it("POST /category should return 201", async () => {
    service.postCategory.mockResolvedValue(validCategory);
    const response = await app.handle(
      new Request("http://localhost/category", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "New Category" }),
      })
    );
    expect(response.status).toBe(201);
  });

  it("PATCH /category/:id should return 200", async () => {
    service.updateCategory.mockResolvedValue(validCategory);
    const response = await app.handle(
      new Request(`http://localhost/category/${mockCategoryId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: "Updated Category" }),
      })
    );
    expect(response.status).toBe(200);
  });

  it("DELETE /category/:id should return 200", async () => {
    service.deleteCategory.mockResolvedValue(undefined);
    const response = await app.handle(
      new Request(`http://localhost/category/${mockCategoryId}`, { 
        method: "DELETE",
        headers 
      })
    );
    expect(response.status).toBe(200);
  });
});
