import { redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import { fetchUserProfile, refreshSession, deleteAuthCookies } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;

	const accessToken = event.cookies.get('accessToken');
	const refreshToken = event.cookies.get('refreshToken');

	let tokenToUse = accessToken;
	let isTokenRefreshed = false;

	// Helper lokal untuk mencoba merefresh session dan mencatat statusnya
	const tryRefresh = async (): Promise<boolean> => {
		if (isTokenRefreshed) return false;
		const newToken = await refreshSession(event.cookies);
		if (newToken) {
			tokenToUse = newToken;
			isTokenRefreshed = true;
			return true;
		}
		return false;
	};

	// Alur 1: Jika accessToken kosong tetapi refreshToken ada, coba refresh session
	if (!tokenToUse && refreshToken) {
		const success = await tryRefresh();
		if (!success) {
			deleteAuthCookies(event.cookies);
		}
	}

	// Alur 2: Jika ada accessToken, coba ambil profil user
	if (tokenToUse && tokenToUse !== 'undefined' && tokenToUse !== 'null') {
		let result = await fetchUserProfile(tokenToUse);

		// Jika token expired (401), lakukan refresh session dan coba request ulang
		if (result.error?.status === 401 && refreshToken) {
			const success = await tryRefresh();
			if (success && tokenToUse) {
				result = await fetchUserProfile(tokenToUse);
			} else {
				deleteAuthCookies(event.cookies);
			}
		}

		// Jika data user berhasil diambil, set ke event.locals.user
		if (!result.error && result.data?.success) {
			event.locals.user = result.data.data;
		}
	}

	// Alur 3: Jalankan routing guard/proteksi halaman
	checkRoutingGuards(event);

	return resolve(event);
};

/**
 * Memeriksa hak akses user terhadap rute yang sedang diakses (Auth Guards)
 */
function checkRoutingGuards(event: RequestEvent) {
	const user = event.locals.user;
	const path = event.url.pathname;

	// Halaman Root '/' selalu diarahkan ke dashboard jika login, atau login page jika belum
	if (path === '/') {
		if (user?.role === 'admin') throw redirect(303, '/admin');
		if (user?.role === 'cashier') throw redirect(303, '/dashboard');
		throw redirect(303, '/login');
	}

	const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');
	const isProtectedRoute = path.startsWith('/dashboard');

	// Proteksi halaman dashboard (harus login)
	if (isProtectedRoute && !user) {
		throw redirect(303, '/login');
	}

	// Mencegah user yang sudah login mengakses halaman auth
	if (isAuthRoute && user) {
		if (user?.role === 'admin') throw redirect(303, '/admin');
		if (user?.role === 'cashier') throw redirect(303, '/dashboard');
	}
}
