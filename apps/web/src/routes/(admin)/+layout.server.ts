import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Redirect jika user belum login
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Redirect jika user bukan admin
	if (locals.user.role !== 'admin') {
		throw redirect(303, '/dashboard');
	}

	return {
		user: locals.user
	};
};

export const ssr = false;
