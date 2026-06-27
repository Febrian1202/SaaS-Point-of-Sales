import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const token = cookies.get('accessToken');
	if (!token) throw redirect(303, '/login');

	const headers = { Authorization: `Bearer ${token}` };
	const page = Number(url.searchParams.get('page') ?? 1);
	const from = url.searchParams.get('from') ?? '';
	const to = url.searchParams.get('to') ?? '';

	const transactionsPromise = serverApi.transactions.get({
		$query: { page, limit: 10, from, to },
		$headers: headers
	});

	return {
		title: 'Riwayat Transaksi | Transa',
		streamed: {
			transactions: transactionsPromise.then((res) => (res.data?.success ? res.data : null))
		}
	};
};
