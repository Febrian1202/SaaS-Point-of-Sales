import { mock, describe, it, expect, beforeEach, beforeAll } from "bun:test";
import { Elysia } from "elysia";

const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
const mockTenantId = "8f682d46-419b-449e-9d29-c09e3a62888c";
const mockProductId = "550e8400-e29b-41d4-a716-446655440002";

const validProduct = {
  id: mockProductId,
  name: "Mock Product",
  slug: "mock-product",
  barcode: "123456",
  sellingPrice: "1000",
  unit: "pcs",
  stockQty: 10,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Product Routes", () => {
  let app: Elysia;
  let service: any;

  beforeAll(async () => {
    mock.module("./service", () => ({
      getProduct: mock(),
      getProductDetail: mock(),
      postProduct: mock(),
      patchProduct: mock(),
      softDeleteProduct: mock(),
    }));

    mock.module("elysia-rate-limit", () => ({
      rateLimit: () => new Elysia(),
    }));

    const mockAuth = new Elysia({ name: "auth" }).derive(() => ({
      userId: mockUserId,
      tenantId: mockTenantId,
      role: "admin",
    }));

    mock.module("@plugin", () => ({
      authPlugin: mockAuth,
      adminGuard: new Elysia({ name: "admin-guard" }).use(mockAuth),
      ConflictError: class extends Error {},
    }));

    const { productRoutes } = await import("./route");
    app = new Elysia().use(productRoutes);
    service = await import("./service");
  });

  beforeEach(() => {
    mock.restore();
  });

  const headers = { 
    "Authorization": "Bearer mock-token",
    "Content-Type": "application/json"
  };

  it("GET /products should return 200", async () => {
    service.getProduct.mockResolvedValue([{
      ...validProduct,
      category: { name: "Food" }
    }]);
    const response = await app.handle(new Request("http://localhost/products", { headers }));
    expect(response.status).toBe(200);
  });

  it("GET /products/:id should return 200", async () => {
    service.getProductDetail.mockResolvedValue({
      ...validProduct,
      category: "Food" // service returns string here
    });
    const response = await app.handle(new Request(`http://localhost/products/${mockProductId}`, { headers }));
    expect(response.status).toBe(200);
  });

  it("POST /products should return 201", async () => {
    service.postProduct.mockResolvedValue({
      id: mockProductId,
      name: "Indomie",
      slug: "indomie"
    });
    const response = await app.handle(
      new Request("http://localhost/products", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "Indomie",
          sellingPrice: "3000",
          categoryId: "550e8400-e29b-41d4-a716-446655440003",
          barcode: "8888",
          unit: "pcs",
          stockQty: 100,
        }),
      })
    );
    expect(response.status).toBe(201);
  });

  it("PATCH /products/:id should return 200", async () => {
    service.patchProduct.mockResolvedValue({
      ...validProduct,
      tenantId: mockTenantId,
      categoryId: "550e8400-e29b-41d4-a716-446655440003"
    });
    const response = await app.handle(
      new Request(`http://localhost/products/${mockProductId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: "Indomie Goreng" }),
      })
    );
    expect(response.status).toBe(200);
  });

  it("DELETE /products/:id should return 200", async () => {
    service.softDeleteProduct.mockResolvedValue(validProduct);
    const response = await app.handle(
      new Request(`http://localhost/products/${mockProductId}`, { 
        method: "DELETE",
        headers 
      })
    );
    expect(response.status).toBe(200);
  });
});
