import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { dev } from '$app/environment';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const storeName = formData.get('storeName') as string;
		const userName = formData.get('userName') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!storeName || !userName || !email || !password) {
			return fail(400, { message: 'All fields are required' });
		}

		const result = await serverApi.auth.register.post({
			storeName,
			userName,
			email,
			password
		});

		if (result.error) {
			return fail(result.error.status, { 
				message: (result.error.value as any)?.message || 'Registration failed' 
			});
		}

		const data = result.data as any;
		const response = result.response as unknown as Response;

		const setCookies = response.headers.getSetCookie();
		const refreshCookie = setCookies.find((c: string) => c.startsWith('refreshToken='));
		
		if (refreshCookie) {
			const match = refreshCookie.match(/refreshToken=([^;]+)/);
			if (match) {
				cookies.set('refreshToken', match[1], {
					path: '/',
					httpOnly: true,
					secure: !dev,
					sameSite: 'strict',
					maxAge: 60 * 60 * 24 * 7
				});
			}
		}

		const token = data?.data?.accessToken;
		if (token) {
			cookies.set('accessToken', token, {
				path: '/',
				httpOnly: false,
				secure: !dev,
				sameSite: 'strict',
				maxAge: 60 * 15
			});
		}

		throw redirect(303, '/dashboard');
	}
};
