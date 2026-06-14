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
	const category = url.searchParams.get('category') ?? '';
	const rawStatus = url.searchParams.get('status') ?? '';
	const barcode = url.searchParams.get('barcode') ?? '';
	const page = url.searchParams.get('page') ?? 1;

	type StatusType = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | undefined;
	let validStatus: StatusType = undefined;

	if (rawStatus === 'AVAILABLE' || rawStatus === 'LOW_STOCK' || rawStatus === 'OUT_OF_STOCK') {
		validStatus = rawStatus;
	}

	const categoryResPromise = serverApi.category.get({
		$query: {},
		$headers: headers
	});

	const categories = await categoryResPromise.then((res) =>
		res.data?.success ? res.data.data : null
	);

	let category_id = '';
	if (category && categories) {
		const found = categories.find((cat) => cat.slug === category);
		if (found) {
			category_id = found.id;
		}
	}

	const productResPromise = serverApi.products.get({
		$query: {
			search,
			barcode,
			category_id,
			...(validStatus && { status: validStatus }),
			page: Number(page),
			limit: 10
		},
		$headers: headers
	});

	return {
		title: 'Products',
		streamed: {
			categories: categoryResPromise.then((res) => (res.data?.success ? res.data.data : null)),
			products: productResPromise.then((res) => (res.data?.success ? res.data : null))
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
		const barcode = formData.get('barcode') as string;
		const categoryId = formData.get('categoryId') as string;
		const priceRaw = formData.get('price') as string;
		const stockRaw = formData.get('stock') as string;
		const unitRaw = formData.get('unit') as string;

		if (!name) {
			return fail(400, { message: 'Nama produk wajib diisi' });
		}

		const stockQty = stockRaw ? parseInt(stockRaw, 10) : 0;

		const response = await serverApi.products.post(
			{
				name,
				barcode: barcode || undefined,
				categoryId: categoryId || undefined,
				sellingPrice: priceRaw || '0',
				stockQty,
				unit: unitRaw || 'pcs'
			},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal menambahkan produk' });
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
			return fail(400, { message: 'ID produk wajib diisi' });
		}

		const response = await serverApi.products[id].delete({
			$headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal menghapus produk' });
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
		const barcode = formData.get('barcode') as string;
		const categoryId = formData.get('categoryId') as string;
		const priceRaw = formData.get('price') as string;
		const stockRaw = formData.get('stock') as string;
		const unitRaw = formData.get('unit') as string;

		if (!id) {
			return fail(400, { message: 'ID produk wajib diisi' });
		}
		if (!name) {
			return fail(400, { message: 'Nama produk wajib diisi' });
		}

		const stockQty = stockRaw ? parseInt(stockRaw, 10) : 0;

		const response = await serverApi.products[id].patch(
			{
				name,
				barcode: barcode || undefined,
				categoryId: categoryId || undefined,
				sellingPrice: priceRaw || '0',
				stockQty,
				unit: unitRaw || 'pcs'
			},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal memperbarui produk' });
		}

		return { success: true };
	}
};
