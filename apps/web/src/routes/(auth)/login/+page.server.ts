import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { setRefreshTokenFromResponse, setAccessToken } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required' });
		}

		// 1. Panggil API Elysia via Server-side Eden Treaty
		const result = await serverApi.auth.login.post({
			email,
			password
		});

		if (result.error) {
			return fail(result.error.status, {
				message: result.error.value?.message || 'Login failed'
			});
		}

		const response = result.response as unknown as Response;
		// Set refreshToken cookie
		setRefreshTokenFromResponse(cookies, response);

		// Set accessToken cookie
		if (result.data && 'data' in result.data) {
			const token = result.data.data.accessToken;
			setAccessToken(cookies, token);
		}

		if (result.data && 'data' in result.data) {
			const role = result.data.data.user.role;
			if (role === 'admin') throw redirect(303, '/admin/dashboard');
		}

		throw redirect(303, '/dashboard');
	}
};
