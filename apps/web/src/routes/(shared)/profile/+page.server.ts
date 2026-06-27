import type { PageServerLoad, Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('accessToken');
	if (!token) throw redirect(303, '/login');

	const response = await serverApi.users.me.get({
		$headers: { Authorization: `Bearer ${token}` }
	});

	return {
		title: 'Profil Saya | Transa',
		profile: response.data?.success ? response.data.data : null
	};
};

export const actions: Actions = {
	update: async ({ request, cookies }) => {
		const token = cookies.get('accessToken');
		if (!token) throw redirect(303, '/login');

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const password = formData.get('password') as string;

		const body: Record<string, string> = {};
		if (name) body.name = name;
		if (password) body.password = password;

		const response = await serverApi.users.me.patch(body, {
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal memperbarui profil' });
		}

		return { success: true, message: 'Profil berhasil diperbarui' };
	}
};
