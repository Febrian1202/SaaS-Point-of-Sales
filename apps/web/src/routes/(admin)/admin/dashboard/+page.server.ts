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

	const dailyResPromise = serverApi.reports.daily.get({
		$query: { date: today },
		$headers: headers
	});

	const rangeResPromise = serverApi.reports['daily-range'].get({
		$query: { from, to },
		$headers: headers
	});

	const transactionsResPromise = serverApi.transactions.get({
		$query: { page: 1, limit: 3 },
		$headers: headers
	});

	const lowStockResPromise = serverApi.products.get({
		$query: { status: 'OUT_OF_STOCK' },
		$headers: headers
	});

	return {
		streamed: {
			daily: dailyResPromise.then((res) => (res.data?.success ? res.data.data : null)),
			range: rangeResPromise.then((res) => (res.data?.success ? res.data.data : [])),
			transactions: transactionsResPromise.then((res) => (res.data?.success ? res.data.data : [])),
			lowStock: lowStockResPromise.then((res) => (res.data?.success ? res.data.data : []))
		}
	};
};
