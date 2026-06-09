import type { Cookies } from "@sveltejs/kit";
import { dev } from '$app/environment';

/**
 * Mengambil refreshToken dari Header HTTP Elysia dan menutimpannya ke Cookie SvelteKit
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
        maxAge: 60 * 60 * 24 * 7,
      })
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
    maxAge: 60 * 5,
  });
}
