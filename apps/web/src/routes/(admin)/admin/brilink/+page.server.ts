import type { PageServerLoad, Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const token = cookies.get('accessToken');
	if (!token) {
		throw redirect(303, '/login');
	}

	const headers = {
		Authorization: `Bearer ${token}`
	};

	// Get query params for filter
	const dateQuery = url.searchParams.get('date') ?? ''; // e.g. YYYY-MM-DD
	const typeQuery = url.searchParams.get('type') ?? ''; // e.g. transfer, tarik_tunai, pembayaran, e-wallet, other
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = Number(url.searchParams.get('limit') ?? '10');

	// We can fetch data with serverApi.brilink
	const queryParams: Record<string, string | number> = {
		page,
		limit
	};
	if (dateQuery) queryParams.date = dateQuery;
	if (typeQuery) queryParams.type = typeQuery;

	// Fetch brilink transactions
	const transactionsPromise = serverApi.brilink.get({
		$query: queryParams,
		$headers: headers
	});

	// For summary cards, let's fetch the summary of the day or month
	// The API accepts a specific 'date' for the summary. Let's use today's date if not specified.
	const summaryDate = dateQuery || new Date().toISOString().substring(0, 10);
	const summaryPromise = serverApi.brilink.summary.get({
		$query: {
			date: summaryDate
		},
		$headers: headers
	});

	return {
		title: 'Manajemen BRILink | Transa',
		dateFilter: dateQuery,
		typeFilter: typeQuery,
		streamed: {
			transactions: transactionsPromise.then((res) => (res.data?.success ? res.data : null)),
			summary: summaryPromise.then((res) => (res.data?.success ? res.data.data : null))
		}
	};
};

export const actions: Actions = {
	void: async ({ request, cookies }) => {
		const token = cookies.get('accessToken');
		if (!token) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { message: 'ID transaksi wajib diisi' });
		}

		const response = await serverApi.brilink[id].void.post(
			{},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal melakukan void transaksi' });
		}

		return { success: true };
	}
};
