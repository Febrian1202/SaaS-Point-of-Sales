import { redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import { refreshSession, deleteAuthCookies } from '$lib/server/auth';
import { env } from '$env/dynamic/private';
import { errors, jwtVerify } from 'jose';

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
		const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

		try {
			// Verifikasi accessToken
			const { payload } = await jwtVerify(tokenToUse, secret);

			// Asumsikan payload berisi data user
			event.locals.user = payload as App.Locals['user'];
		} catch (e) {
			// Jika token expired
			if (e instanceof errors.JWTExpired && refreshToken) {
				const success = await tryRefresh();

				if (success && tokenToUse) {
					try {
						// Verifikasi token yang sudah di-refresh
						const { payload } = await jwtVerify(tokenToUse, secret);
						event.locals.user = payload as App.Locals['user'];
					} catch (e) {
						// Jika token refresh gagal
						console.error(e); // TODO: handle refresh error
						deleteAuthCookies(event.cookies);
					}
				} else {
					deleteAuthCookies(event.cookies);
				}
			}
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
		if (user?.role === 'admin') throw redirect(303, '/admin/dashboard');
		if (user?.role === 'cashier') throw redirect(303, '/dashboard');
		throw redirect(303, '/login');
	}

	const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');
	const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/admin');

	// Proteksi halaman dashboard (harus login)
	if (isProtectedRoute && !user) {
		throw redirect(303, '/login');
	}

	// Mencegah user yang sudah login mengakses halaman auth
	if (isAuthRoute && user) {
		if (user?.role === 'admin') throw redirect(303, '/admin/dashboard');
		if (user?.role === 'cashier') throw redirect(303, '/dashboard');
	}
}
