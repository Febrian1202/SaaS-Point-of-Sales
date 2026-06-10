import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';

const performLogout = async (cookies: any) => {
	// 1. Panggil logout di Elysia (opsional, untuk menghapus session di DB)
	const token = cookies.get('accessToken');
	
	if (token) {
		await serverApi.auth.logout.post(
			{},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);
	}

	// 2. Hapus semua cookie auth di browser
	cookies.delete('accessToken', { path: '/' });
	cookies.delete('refreshToken', { path: '/' });

	// 3. Redirect ke login
	throw redirect(303, '/login');
};

export const load: PageServerLoad = async ({ cookies }) => {
	await performLogout(cookies);
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		await performLogout(cookies);
	}
};
