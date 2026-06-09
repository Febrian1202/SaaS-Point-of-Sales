import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';

export const actions: Actions = {
	default: async ({ cookies }) => {
		// 1. Panggil logout di Elysia (opsional, untuk menghapus session di DB)
		// Kita butuh accessToken untuk ini jika route-nya diproteksi
		const token = cookies.get('accessToken');
		
		if (token) {
			await serverApi.auth.logout.post({}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
		}

		// 2. Hapus semua cookie auth di browser
		cookies.delete('accessToken', { path: '/' });
		cookies.delete('refreshToken', { path: '/auth' });

		// 3. Redirect ke login
		throw redirect(303, '/login');
	}
};
