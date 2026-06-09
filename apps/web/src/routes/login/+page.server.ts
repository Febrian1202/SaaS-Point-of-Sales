import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { dev } from '$app/environment';

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
				message: (result.error.value as any)?.message || 'Login failed' 
			});
		}

		const data = result.data as any;
		const response = result.response as unknown as Response;

		// 2. Ambil refreshToken dari header Elysia
		// Menggunakan getSetCookie() untuk mendapatkan array cookie yang dikirim server
		const setCookies = response.headers.getSetCookie();
		const refreshCookie = setCookies.find((c: string) => c.startsWith('refreshToken='));
		
		if (refreshCookie) {
			const match = refreshCookie.match(/refreshToken=([^;]+)/);
			if (match) {
				cookies.set('refreshToken', match[1], {
					path: '/', // Ubah ke '/' agar bisa diakses di semua route SvelteKit
					httpOnly: true,
					secure: !dev,
					sameSite: 'strict',
					maxAge: 60 * 60 * 24 * 7
				});
			}
		}

		// 3. Simpan accessToken
		// Pastikan kita mengambil dari data.data.accessToken sesuai schema withSuccess
		const token = data?.data?.accessToken;
		if (token) {
			cookies.set('accessToken', token, {
				path: '/',
				httpOnly: false, // Agar bisa dibaca oleh Eden Treaty di sisi client
				secure: !dev,
				sameSite: 'strict',
				maxAge: 60 * 15
			});
		}

		throw redirect(303, '/dashboard');
	}
};
