import { describe, it, expect, mock, beforeEach, beforeAll } from 'bun:test';

mock.module('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => {
		const err = new Error('redirect');
		(err as any).status = status;
		(err as any).location = location;
		throw err;
	}
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
			logout: {
				post: mock()
			}
		}
	}
}));

describe('Logout Action', () => {
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
			get: mock(() => 'mock-token'),
			delete: mock()
		};
		(serverApi.auth.logout.post as any).mockClear();
	});

	it('should logout, delete cookies and redirect', async () => {
		(serverApi.auth.logout.post as any).mockResolvedValue({ success: true });

		try {
			await (actions.default as any)({ cookies });
		} catch (e: any) {
			expect(e.status).toBe(303);
			expect(e.location).toBe('/login');
		}

		expect(serverApi.auth.logout.post).toHaveBeenCalled();
		expect(cookies.delete).toHaveBeenCalledWith('accessToken', { path: '/' });
		expect(cookies.delete).toHaveBeenCalledWith('refreshToken', { path: '/' });
	});
});
