import { redirect, type Handle } from '@sveltejs/kit';
import { serverApi } from '$lib/server/api';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Inisialisasi locals user
	event.locals.user = null;

	const accessToken = event.cookies.get('accessToken');
	const refreshToken = event.cookies.get('refreshToken');

	let tokenToUse = accessToken;
	let isTokenRefreshed = false;

	// Helper function untuk memanggil API refresh token
	const refreshSession = async () => {
		if (!refreshToken) return false;
		
		try {
			// Sesuai syntax Eden Treaty, header dipassing via $headers
			const result = await serverApi.auth.refresh.post(null as any, {
				$headers: {
					Cookie: `refreshToken=${refreshToken}`
				}
			} as any);

			const data = result.data as any;
			if (!result.error && data?.success) {
				tokenToUse = data.data.accessToken;
				isTokenRefreshed = true;

				// Perbarui cookie di browser
				event.cookies.set('accessToken', tokenToUse as string, {
					path: '/',
					httpOnly: false,
					secure: !dev,
					sameSite: 'strict',
					maxAge: 60 * 15
				});
				return true;
			}
		} catch (e) {
			console.error('Failed to refresh token:', e);
		}
		
		return false;
	};

	// 2. Jika tidak ada access token tapi ada refresh token, coba refresh dulu
	if (!tokenToUse && refreshToken) {
		const success = await refreshSession();
		if (!success) {
			// Refresh token tidak valid/kedaluwarsa, bersihkan cookies
			event.cookies.delete('accessToken', { path: '/' });
			event.cookies.delete('refreshToken', { path: '/' });
		}
	}

	// 3. Jika sekarang kita punya access token yang valid, ambil data user
	if (tokenToUse && tokenToUse !== 'undefined' && tokenToUse !== 'null') {
		const fetchUser = async (token: string) => {
			return await serverApi.users.me.get({
				$headers: {
					Authorization: `Bearer ${token}`
				}
			} as any);
		};

		let result = await fetchUser(tokenToUse);

		// 4. Jika access token ternyata sudah expired (401) saat dipakai, 
		//    dan kita belum mencoba refresh di request ini, lakukan refresh sekarang.
		const err = result.error as any;
		if (err?.status === 401 && !isTokenRefreshed && refreshToken) {
			const success = await refreshSession();
			if (success && tokenToUse) {
				result = await fetchUser(tokenToUse);
			} else {
				event.cookies.delete('accessToken', { path: '/' });
				event.cookies.delete('refreshToken', { path: '/' });
			}
		}

		const data = result.data as any;
		if (!result.error && data?.success) {
			event.locals.user = data.data; // Simpan data user ke locals
		}
	}

	// 5. Auth Guards (Proteksi Route)
	// Proteksi root route '/'
	if (event.url.pathname === '/') {
		if (event.locals.user) throw redirect(303, '/dashboard');
		else throw redirect(303, '/login');
	}

	const isAuthRoute = event.url.pathname.startsWith('/login') || event.url.pathname.startsWith('/register');
	const isProtectedRoute = event.url.pathname.startsWith('/dashboard');

	// Jika user mencoba masuk halaman proteksi tapi belum login
	if (isProtectedRoute && !event.locals.user) {
		throw redirect(303, '/login');
	}

	// Jika user sudah login tapi mencoba akses halaman login/register
	if (isAuthRoute && event.locals.user) {
		throw redirect(303, '/dashboard');
	}

	// Lanjutkan request SvelteKit
	return resolve(event);
};
