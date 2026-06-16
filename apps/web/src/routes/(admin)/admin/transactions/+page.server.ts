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

	// Ambil query params
	const search = url.searchParams.get('search') ?? '';
	const page = url.searchParams.get('page') ?? 1;
	const from = url.searchParams.get('from') ?? '';
	const to = url.searchParams.get('to') ?? '';

	const transactionsResPromise = serverApi.transactions.get({
		$query: {
			search,
			page: Number(page),
			limit: 10,
			from,
			to
		},
		$headers: headers
	});

	const today = new Date().toISOString().substring(0, 10);
	const dailyResPromise = serverApi.reports.daily.get({
		$query: { date: today },
		$headers: headers
	});

	return {
		title: 'Riwayat Transaksi | Transa',
		streamed: {
			transactions: transactionsResPromise.then((res) => (res.data?.success ? res.data : null)),
			dailyStats: dailyResPromise.then((res) => (res.data?.success ? res.data.data : null))
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

		const response = await serverApi.transactions[id].void.post(
			{},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (!response.data?.success) {
			return fail(400, { message: response.data?.message || 'Gagal membatalkan transaksi' });
		}

		return { success: true };
	}
};
