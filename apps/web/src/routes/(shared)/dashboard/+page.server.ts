import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('accessToken');
	if (!token) throw redirect(303, '/login');

	const headers = { Authorization: `Bearer ${token}` };
	const today = new Date().toISOString().substring(0, 10);

	// Ambil 5 transaksi terbaru + total hari ini
	const transactionsPromise = serverApi.transactions.get({
		$query: { page: 1, limit: 5, date: today },
		$headers: headers
	});

	return {
		title: 'Dasbor | Transa',
		streamed: {
			transactions: transactionsPromise.then((res) => (res.data?.success ? res.data : null))
		}
	};
};
