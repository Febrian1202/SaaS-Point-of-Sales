import { describe, it, expect, mock, beforeEach, beforeAll } from "bun:test";

// Mocking SvelteKit modules
mock.module("@sveltejs/kit", () => ({
    redirect: (status: number, location: string) => {
        const err = new Error("redirect");
        (err as any).status = status;
        (err as any).location = location;
        throw err;
    },
    fail: (status: number, data: any) => ({ status, data })
}));

mock.module("$app/environment", () => ({
    dev: true
}));

mock.module("$env/static/private", () => ({
    PRIVATE_API_URL: "http://localhost:3000"
}));

mock.module("$env/static/public", () => ({
    PUBLIC_API_URL: "http://localhost:3000"
}));

// Mocking the serverApi
mock.module("$lib/server/api", () => ({
    serverApi: {
        auth: {
            login: {
                post: mock()
            }
        }
    }
}));

describe("Login Action", () => {
    let cookies: any;
    let actions: any;
    let serverApi: any;

    beforeAll(async () => {
        // Import actions AFTER mocking
        const mod = await import("./+page.server");
        actions = mod.actions;
        const apiMod = await import("$lib/server/api");
        serverApi = apiMod.serverApi;
    });

    beforeEach(() => {
        cookies = {
            set: mock(),
            get: mock(),
            delete: mock()
        };
        (serverApi.auth.login.post as any).mockClear();
    });

    it("should fail if email or password is missing", async () => {
        const request = {
            formData: async () => new Map([["email", ""]])
        };

        const result = await (actions.default as any)({ request, cookies });

        expect(result.status).toBe(400);
        expect(result.data.message).toBe("Email and password are required");
    });

    it("should login successfully and set cookies", async () => {
        const mockResponse = {
            data: {
                success: true,
                data: { accessToken: "mock-access-token" }
            },
            error: null,
            response: {
                headers: {
                    get: (name: string) => name === "set-cookie" ? "refreshToken=mock-refresh-token; HttpOnly" : null
                }
            }
        };

        (serverApi.auth.login.post as any).mockResolvedValue(mockResponse);

        const request = {
            formData: async () => new Map([
                ["email", "test@example.com"],
                ["password", "password123"]
            ])
        };

        try {
            await (actions.default as any)({ request, cookies });
        } catch (e: any) {
            expect(e.status).toBe(303);
            expect(e.location).toBe("/dashboard");
        }

        // Verify cookies were set
        expect(cookies.set).toHaveBeenCalledWith("accessToken", "mock-access-token", expect.any(Object));
        expect(cookies.set).toHaveBeenCalledWith("refreshToken", "mock-refresh-token", expect.any(Object));
    });

    it("should return fail if API returns error", async () => {
        const mockErrorResponse = {
            data: null,
            error: {
                status: 401,
                value: { message: "Invalid credentials" }
            }
        };

        (serverApi.auth.login.post as any).mockResolvedValue(mockErrorResponse);

        const request = {
            formData: async () => new Map([
                ["email", "wrong@example.com"],
                ["password", "wrongpass"]
            ])
        };

        const result = await (actions.default as any)({ request, cookies });

        expect(result.status).toBe(401);
        expect(result.data.message).toBe("Invalid credentials");
    });
});
