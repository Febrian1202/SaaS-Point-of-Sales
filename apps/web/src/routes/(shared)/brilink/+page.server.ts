import type { PageServerLoad, Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const token = cookies.get('accessToken');
	if (!token) throw redirect(303, '/login');

	const headers = { Authorization: `Bearer ${token}` };
	const today = new Date().toISOString().substring(0, 10);
	const date = url.searchParams.get('date') ?? today;
	const type = url.searchParams.get('type') ?? '';
	const page = Number(url.searchParams.get('page') ?? 1);

	const [summaryPromise, transactionsPromise] = [
		serverApi.brilink.summary.get({ $query: { date }, $headers: headers }),
		serverApi.brilink.get({
			$query: { date, ...(type && type !== 'all' ? { type: type as any } : {}), page, limit: 10 },
			$headers: headers
		})
	];

	return {
		title: 'BRI Link | Transa',
		dateFilter: date,
		typeFilter: type,
		streamed: {
			summary: summaryPromise.then((res) => (res.data?.success ? res.data.data : null)),
			transactions: transactionsPromise.then((res) => (res.data?.success ? res.data : null))
		}
	};
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const token = cookies.get('accessToken');
		if (!token) throw redirect(303, '/login');

		const formData = await request.formData();
		const body = JSON.parse(formData.get('body') as string);

		const response = await serverApi.brilink.post(body as any, {
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!response.data?.success) {
			return fail(400, { message: (response.data as any)?.message || 'Gagal mencatat transaksi' });
		}

		return { success: true };
	}
};
