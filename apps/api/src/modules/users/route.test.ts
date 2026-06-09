import { mock, describe, it, expect, beforeEach, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import path from "path";

const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
const mockTenantId = "8f682d46-419b-449e-9d29-c09e3a62888c";

const validUser = {
  id: mockUserId,
  name: "Mock User",
  email: "mock@example.com",
  role: "admin",
  tenantId: mockTenantId,
};

describe("User Routes", () => {
  let app: Elysia;
  let service: any;

  beforeAll(async () => {
    const mockAuth = new Elysia({ name: "auth" }).derive(() => ({
      userId: mockUserId,
      tenantId: mockTenantId,
      role: "admin",
    }));

    const mockAdmin = new Elysia({ name: "admin-guard" }).use(mockAuth);

    mock.module("@/plugins", () => ({
      authPlugin: mockAuth,
      adminGuard: mockAdmin,
      ConflictError: class extends Error {},
      jwtAccessSetup: new Elysia(),
      jwtRefreshSetup: new Elysia(),
      logger: new Elysia(),
      cors: () => new Elysia(),
      swagger: () => new Elysia(),
    }));

    mock.module("./service.ts", () => ({
      getCashier: mock(),
      registerCashier: mock(),
      getUser: mock(),
      updateCashier: mock(),
      deleteCashier: mock(),
      updateOwnProfile: mock(),
    }));

    const { usersRoutes } = await import("./route");
    app = new Elysia().use(usersRoutes);
    service = await import("./service");
  });

  beforeEach(() => {
    mock.restore();
  });

  const headers = { 
    "Authorization": "Bearer mock-token",
    "Content-Type": "application/json"
  };

  it("GET /users/me should return 200", async () => {
    service.getUser.mockResolvedValue(validUser);
    const response = await app.handle(new Request("http://localhost/users/me", { headers }));
    expect(response.status).toBe(200);
  });

  it("PATCH /users/me should return 200", async () => {
    service.updateOwnProfile.mockResolvedValue(validUser);
    const response = await app.handle(
      new Request("http://localhost/users/me", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: "New Name" }),
      })
    );
    expect(response.status).toBe(200);
  });

  it("GET /users should return 200", async () => {
    service.getCashier.mockResolvedValue([validUser]);
    const response = await app.handle(new Request("http://localhost/users", { headers }));
    expect(response.status).toBe(200);
  });

  it("POST /users should return 201", async () => {
    service.registerCashier.mockResolvedValue(validUser);
    const response = await app.handle(
      new Request("http://localhost/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "New Staff",
          email: "staff@example.com",
          password: "password123",
        }),
      })
    );
    expect(response.status).toBe(201);
  });

  it("DELETE /users/:id should return 200", async () => {
    service.deleteCashier.mockResolvedValue({ id: mockUserId });
    const response = await app.handle(
      new Request(`http://localhost/users/${mockUserId}`, { 
        method: "DELETE",
        headers 
      })
    );
    expect(response.status).toBe(200);
  });
});
