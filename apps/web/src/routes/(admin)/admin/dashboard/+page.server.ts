import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('accessToken');
	if (!token) {
		throw redirect(303, '/login');
	}

	const headers = {
		Authorization: `Bearer ${token}`
	};

	const today = new Date().toISOString().substring(0, 10);

	const toDate = new Date();
	const fromDate = new Date();
	fromDate.setDate(toDate.getDate() - 27);
	const from = fromDate.toISOString().substring(0, 10);
	const to = toDate.toISOString().substring(0, 10);

	const [dailyRes, rangeRes, transactionsRes, lowStockRes] = await Promise.all([
		serverApi.reports.daily.get({
			$query: { date: today },
			$headers: headers
		}),
		serverApi.reports['daily-range'].get({
			$query: { from, to },
			$headers: headers
		}),
		serverApi.transactions.get({
			$query: { page: 1, limit: 3 },
			$headers: headers
		}),
		serverApi.products.get({
			$query: { status: 'LOW_STOCK' },
			$headers: headers
		})
	]);

	return {
		title: 'Dasbor | Transa',
		metrics: {
			daily: dailyRes.data?.success ? dailyRes.data.data : null,
			range: rangeRes.data?.success ? rangeRes.data.data : [],
			transactions: transactionsRes.data?.success ? transactionsRes.data.data : [],
			lowStock: lowStockRes.data?.success ? lowStockRes.data.data : []
		}
	};
};
