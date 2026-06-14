import type { PageServerLoad, Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, cookies }) => {
	// Ambil access token dari cookies
	const token = cookies.get('accessToken');
	if (!token) {
		throw redirect(303, '/login');
	}

	// Persiapan header
	const headers = {
		Authorization: `Bearer ${token}`
	};

	// Ambil query params
	const search = url.searchParams.get('search') ?? '';

	// Panggil API kategori dengan parameter pencarian
	const categoryResPromise = serverApi.category.get({
		$query: {
			search: search
		},
		$headers: headers
	});

	return {
		title: 'Kategori Produk | Transa',
		streamed: {
			categories: categoryResPromise.then((res) => (res.data?.success ? res.data.data : []))
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

		if (!name) {
			return fail(400, { message: 'Nama kategori wajib diisi' });
		}

		const response = await serverApi.category.post(
			{
				name
			},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal menambahkan kategori' });
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

		if (!id) {
			return fail(400, { message: 'ID kategori wajib diisi' });
		}
		if (!name) {
			return fail(400, { message: 'Nama kategori wajib diisi' });
		}

		const response = await serverApi.category[id].patch(
			{
				name
			},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal memperbarui kategori' });
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
			return fail(400, { message: 'ID kategori wajib diisi' });
		}

		const response = await serverApi.category[id].delete({
			$headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal menghapus kategori' });
		}

		return { success: true };
	}
};
