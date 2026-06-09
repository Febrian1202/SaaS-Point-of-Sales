import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Me-return data user yang disiapkan oleh hooks.server.ts
	// Ini akan membuat `data.user` tersedia di seluruh komponen Svelte
	// melalui `let { data } = $props();`
	return {
		user: locals.user
	};
};
