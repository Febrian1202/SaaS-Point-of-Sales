import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { serverApi } from './api';

/**
 * Mengambil refreshToken dari Header HTTP Elysia dan menyimpannya ke Cookie SvelteKit
 */
export function setRefreshTokenFromResponse(cookies: Cookies, response: Response) {
	const setCookies = response.headers.getSetCookie();
	const refreshCookie = setCookies.find((c: string) => c.startsWith('refreshToken='));

	if (refreshCookie) {
		const match = refreshCookie.match(/refreshToken=([^;]+)/);
		if (match) {
			cookies.set('refreshToken', match[1], {
				path: '/',
				httpOnly: true,
				secure: !dev,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7 // 7 hari
			});
		}
	}
}

/**
 * Menyimpan accessToken mentah dari body response Elysia ke Cookie SvelteKit
 */
export function setAccessToken(cookies: Cookies, token: string) {
	cookies.set('accessToken', token, {
		path: '/',
		httpOnly: false,
		secure: !dev,
		sameSite: 'strict',
		maxAge: 60 * 5 // 5 menit (sesuai expiration JWT access token)
	});
}

/**
 * Menghapus semua cookie autentikasi (accessToken dan refreshToken)
 */
export function deleteAuthCookies(cookies: Cookies) {
	cookies.delete('accessToken', { path: '/' });
	cookies.delete('refreshToken', { path: '/' });
}

/**
 * Memperbarui session (Silent Refresh) menggunakan refreshToken yang ada di cookie
 */
export async function refreshSession(cookies: Cookies): Promise<string | null> {
	const refreshToken = cookies.get('refreshToken');
	if (!refreshToken) return null;

	try {
		const result = await serverApi.auth.refresh.post(
			{},
			{
				headers: {
					Cookie: `refreshToken=${refreshToken}`
				}
			}
		);

		if (result.error) {
			console.error('Refresh token ditolak:', result.error.status);
			return null;
		}

		if (result.data?.success) {
			const token = result.data.data.accessToken;
			setAccessToken(cookies, token);
			return token;
		}
	} catch (e) {
		console.error('Koneksi gagal saat refresh token:', e);
	}

	return null;
}

/**
 * Mengambil profil user yang sedang login menggunakan accessToken
 */
export async function fetchUserProfile(token: string) {
	return await serverApi.users.me.get({
		$headers: {
			Authorization: `Bearer ${token}`
		}
	});
}
