import { edenTreaty } from '@elysiajs/eden';
import type { App } from '@';
import { PUBLIC_API_URL } from '$env/static/public';

// Helper untuk mengambil cookie di sisi client
function getCookie(name: string) {
	if (typeof document === 'undefined') return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(';').shift();
	return null;
}

export const api = edenTreaty<App>(PUBLIC_API_URL, {
	fetcher: ((url: string, options) => {
		const token = getCookie('accessToken');
		const headers = new Headers(options?.headers);
		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		}
		return fetch(url, { ...options, headers });
	}) as typeof fetch
});
