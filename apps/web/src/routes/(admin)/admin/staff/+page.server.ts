import type { PageServerLoad, Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('accessToken');
	if (!token) {
		throw redirect(303, '/login');
	}

	const headers = {
		Authorization: `Bearer ${token}`
	};

	const staffsResPromise = serverApi.users.get({
		$headers: headers
	});

	return {
		title: 'Manajemen Staf | Transa',
		streamed: {
			staffs: staffsResPromise.then((res) => (res.data?.success ? res.data.data : null))
		}
	};
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const token = cookies.get('accessToken');
		if (!token) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!name || !email || !password) {
			return fail(400, { message: 'Nama, email, dan password wajib diisi' });
		}

		const response = await serverApi.users.post(
			{
				name,
				email,
				password
			},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal menambahkan kasir' });
		}

		return { success: true };
	},

	update: async ({ request, cookies }) => {
		const token = cookies.get('accessToken');
		if (!token) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!id) {
			return fail(400, { message: 'ID staf wajib diisi' });
		}
		if (!name || !email) {
			return fail(400, { message: 'Nama dan email wajib diisi' });
		}

		const payload: Record<string, string> = { name, email };
		if (password && password.trim() !== '') {
			payload.password = password;
		}

		const response = await serverApi.users[id].patch(payload, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal memperbarui kasir' });
		}

		return { success: true };
	},

	delete: async ({ request, cookies }) => {
		const token = cookies.get('accessToken');
		if (!token) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { message: 'ID staf wajib diisi' });
		}

		const response = await serverApi.users[id].delete({
			$headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal menonaktifkan kasir' });
		}

		return { success: true };
	}
};
