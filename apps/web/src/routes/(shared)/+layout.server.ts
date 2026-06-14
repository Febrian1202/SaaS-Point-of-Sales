import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Redirect jika user belum login
	if (!locals.user) throw redirect(303, '/login');

	const allowedRoles = ['admin', 'cashier'];
	if (!allowedRoles.includes(locals.user.role)) throw redirect(303, '/login');

	return {
		user: locals.user
	};
};
