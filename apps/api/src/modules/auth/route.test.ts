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

describe("Auth Routes", () => {
  let app: Elysia;
  let service: any;
  let userService: any;

  beforeAll(async () => {
    mock.module("./service.ts", () => ({
      verifyUsers: mock(),
      registerBusiness: mock(),
      updateRefreshToken: mock(),
    }));

    mock.module("../users/service.ts", () => ({
      getUser: mock(),
      getCashier: mock(),
      registerCashier: mock(),
      updateCashier: mock(),
      deleteCashier: mock(),
      updateOwnProfile: mock(),
    }));

    mock.module("elysia-rate-limit", () => ({
      rateLimit: () => new Elysia(),
    }));

    const mockJwt = {
      sign: mock(async () => "mock-token"),
      verify: mock(async () => ({ sub: mockUserId, tenantId: mockTenantId, role: "admin" })),
    };

    const mockAuthPlugin = new Elysia({ name: "auth" }).derive(() => ({
      userId: mockUserId,
      tenantId: mockTenantId,
      role: "admin",
    }));

    mock.module("@plugin", () => ({
      authPlugin: mockAuthPlugin,
      jwtAccessSetup: new Elysia().decorate("accessJwt", mockJwt),
      jwtRefreshSetup: new Elysia().decorate("refreshJwt", mockJwt),
      adminGuard: new Elysia({ name: "admin-guard" }),
      SessionError: class extends Error {},
      RegisterError: class extends Error {},
      ConflictError: class extends Error {},
    }));

    const { authRoutes } = await import("./route");
    app = new Elysia()
      .onError(({ error }) => {
        console.log("AUTH CRASH:", error.message);
        return error;
      })
      .use(authRoutes);
    service = await import("./service");
    userService = await import("@modules/users/service");
  });

  beforeEach(() => {
    mock.restore();
  });

  describe("POST /auth/login", () => {
    it("should return 200 and tokens on successful login", async () => {
      service.verifyUsers.mockResolvedValue(validUser);
      service.updateRefreshToken.mockResolvedValue(undefined);

      const response = await app.handle(
        new Request("http://localhost/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(response.headers.get("Set-Cookie")).toContain("refreshToken=");
    });
  });

  describe("POST /auth/register", () => {
    it("should return 201 on successful registration", async () => {
      service.registerBusiness.mockResolvedValue({
        user: { ...validUser, role: "admin" },
        store: { id: mockTenantId, name: "Mock Store", slug: "mock-store" },
      });

      const response = await app.handle(
        new Request("http://localhost/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: "Admin User",
            email: "admin@store.com",
            password: "password123",
            storeName: "My Store",
          }),
        })
      );

      expect(response.status).toBe(201);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh tokens with valid cookie", async () => {
      userService.getUser.mockResolvedValue({
        ...validUser,
        refreshToken: "valid-token",
      });

      const response = await app.handle(
        new Request("http://localhost/auth/refresh", {
          method: "POST",
          headers: { "Cookie": "refreshToken=valid-token" },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.accessToken).toBeDefined();
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout successfully", async () => {
      const response = await app.handle(
        new Request("http://localhost/auth/logout", {
          method: "POST",
          headers: { 
            "Authorization": "Bearer token",
            "Cookie": "refreshToken=token"
          },
        })
      );

      expect(response.status).toBe(200);
    });
  });
});
