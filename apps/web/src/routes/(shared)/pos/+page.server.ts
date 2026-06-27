import type { PageServerLoad, Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('accessToken');
	if (!token) throw redirect(303, '/login');

	const headers = { Authorization: `Bearer ${token}` };

	const [productsRes, categoriesRes] = await Promise.all([
		serverApi.products.get({
			$query: { limit: 50, status: 'AVAILABLE' },
			$headers: headers
		}),
		serverApi.category.get({ $query: {}, $headers: headers })
	]);

	const rawProducts =
		productsRes.data && 'success' in productsRes.data && productsRes.data.success
			? productsRes.data.data
			: [];
	const mappedProducts = (rawProducts as Record<string, unknown>[]).map((p) => ({
		...p,
		stock: p.stockQty,
		price: p.sellingPrice
	}));

	return {
		title: 'Kasir | Transa',
		products: mappedProducts,
		categories: categoriesRes.data?.success ? categoriesRes.data.data : []
	};
};

export const actions: Actions = {
	checkout: async ({ request, cookies }) => {
		const token = cookies.get('accessToken');
		if (!token) throw redirect(303, '/login');

		const formData = await request.formData();
		const body = JSON.parse(formData.get('body') as string);

		const response = await serverApi.transactions.post(body, {
			headers: { Authorization: `Bearer ${token}` }
		} as Record<string, unknown>);

		if (!response.data || !('success' in response.data) || !response.data.success) {
			const dataRecord = response.data as Record<string, unknown> | null;
			const message =
				dataRecord && typeof dataRecord.message === 'string'
					? dataRecord.message
					: 'Transaksi gagal';
			return fail(400, { message });
		}

		return { success: true, data: (response.data as Record<string, unknown>).data };
	}
};
