import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const token = cookies.get('accessToken');
	if (!token) throw redirect(303, '/login');

	const response = await serverApi.transactions[params.id].get({
		$headers: { Authorization: `Bearer ${token}` }
	});

	if (!response.data?.success) throw error(404, 'Transaksi tidak ditemukan');

	return {
		title: 'Detail Transaksi | Transa',
		transaction: response.data.data
	};
};
