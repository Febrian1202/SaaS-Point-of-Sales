import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { setRefreshTokenFromResponse, setAccessToken } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const storeName = formData.get('storeName') as string;
		const userName = formData.get('userName') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		// Validasi dasar di sisi server
		if (!storeName || !userName || !email || !password) {
			return fail(400, { message: 'All fields are required' });
		}

		const result = await serverApi.auth.register.post({
			storeName: storeName,
			userName: userName,
			email: email,
			password: password
		});

		if (result.error) {
			return fail(result.error.status, {
				message: result.error.value?.message || 'Registration failed'
			});
		}

		const webResponse = result.response as unknown as Response;

		// Set refreshToken cookie
		setRefreshTokenFromResponse(cookies, webResponse);

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
