import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = cookies.get('accessToken');
	if (!token) {
		throw redirect(303, '/login');
	}

	const headers = {
		Authorization: `Bearer ${token}`
	};

	const dateParam = url.searchParams.get('date');
	const today = new Date().toISOString().substring(0, 10);
	const targetDate = dateParam || today;

	// For monthly, extract year-month from targetDate
	const targetMonth = targetDate.substring(0, 7);

	// Get array of last 6 months for the monthly chart
	const dateObj = new Date(targetDate);
	const monthsToFetch: string[] = [];
	for (let i = 5; i >= 0; i--) {
		const d = new Date(dateObj.getFullYear(), dateObj.getMonth() - i, 1);
		monthsToFetch.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
	}

	const [dailyRes, monthlyRes, ...monthlyRangePromises] = await Promise.all([
		serverApi.reports.daily.get({
			$query: { date: targetDate },
			$headers: headers
		}),
		serverApi.reports.monthly.get({
			$query: { month: targetMonth },
			$headers: headers
		}),
		...monthsToFetch.map((m) =>
			serverApi.reports.monthly.get({
				$query: { month: m },
				$headers: headers
			})
		)
	]);

	const monthlyRange = monthlyRangePromises.map((res, index) => {
		if (res.data?.success) {
			return res.data.data;
		}
		// Fallback zero data if API fails or empty
		return {
			month: monthsToFetch[index],
			retailRevenue: 0,
			retailCogs: 0,
			brilinkCommission: 0,
			totalRevenue: 0,
			grossProfit: 0,
			trxCount: 0
		};
	});

	// Fetch a default daily-range for the month to build the "Tren Omzet Bulanan" chart
	const firstDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
		.toISOString()
		.substring(0, 10);
	const lastDay = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0)
		.toISOString()
		.substring(0, 10);

	const rangeRes = await serverApi.reports['daily-range'].get({
		$query: { from: firstDay, to: lastDay },
		$headers: headers
	});

	return {
		title: 'Laporan | Transa',
		dateFilter: targetDate,
		metrics: {
			daily: dailyRes.data?.success ? dailyRes.data.data : null,
			monthly: monthlyRes.data?.success ? monthlyRes.data.data : null,
			range: rangeRes.data?.success ? rangeRes.data.data : [],
			monthlyRange: monthlyRange
		}
	};
};
