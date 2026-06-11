import { describe, it, expect, mock, beforeEach, beforeAll } from 'bun:test';

// Mocking SvelteKit modules (similar to login test)
mock.module('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => {
		const err = new Error('redirect');
		(err as any).status = status;
		(err as any).location = location;
		throw err;
	},
	fail: (status: number, data: any) => ({ status, data })
}));

mock.module('$app/environment', () => ({
	dev: true
}));

mock.module('$env/static/private', () => ({
	PRIVATE_API_URL: 'http://localhost:3000'
}));

mock.module('$env/static/public', () => ({
	PUBLIC_API_URL: 'http://localhost:3000'
}));

mock.module('$lib/server/api', () => ({
	serverApi: {
		auth: {
			register: {
				post: mock()
			}
		}
	}
}));

describe('Register Action', () => {
	let cookies: any;
	let actions: any;
	let serverApi: any;

	beforeAll(async () => {
		const mod = await import('./+page.server');
		actions = mod.actions;
		const apiMod = await import('$lib/server/api');
		serverApi = apiMod.serverApi;
	});

	beforeEach(() => {
		cookies = {
			set: mock(),
			get: mock(),
			delete: mock()
		};
		(serverApi.auth.register.post as any).mockClear();
	});

	it('should register successfully and set cookies', async () => {
		const mockResponse = {
			data: {
				success: true,
				data: { accessToken: 'mock-access-token' }
			},
			error: null,
			response: {
				headers: {
					getSetCookie: () => ['refreshToken=mock-refresh-token; HttpOnly']
				}
			}
		};

		(serverApi.auth.register.post as any).mockResolvedValue(mockResponse);

		const request = {
			formData: async () =>
				new Map([
					['storeName', 'My Store'],
					['userName', 'Admin'],
					['email', 'admin@store.com'],
					['password', 'password123']
				])
		};

		try {
			await (actions.default as any)({ request, cookies });
		} catch (e: any) {
			expect(e.status).toBe(303);
			expect(e.location).toBe('/dashboard');
		}

		expect(cookies.set).toHaveBeenCalledWith(
			'accessToken',
			'mock-access-token',
			expect.any(Object)
		);
		expect(cookies.set).toHaveBeenCalledWith(
			'refreshToken',
			'mock-refresh-token',
			expect.any(Object)
		);
	});

	it('should fail if fields are missing', async () => {
		const request = {
			formData: async () => new Map([['email', 'admin@store.com']])
		};

		const result = await (actions.default as any)({ request, cookies });

		expect(result.status).toBe(400);
		expect(result.data.message).toBe('All fields are required');
	});
});
