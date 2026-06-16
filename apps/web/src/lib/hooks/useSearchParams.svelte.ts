import { goto } from '$app/navigation';
import { page } from '$app/state';
import { SvelteURL } from 'svelte/reactivity';

/**
 * Hook to manage search params and synchronize them with the URL.
 * In Svelte 5 runes, we can return reactive state objects.
 */
export function useSearchParams() {
	function getParam(key: string, defaultValue: string = '') {
		return page.url.searchParams.get(key) ?? defaultValue;
	}

	function updateUrl(params: Record<string, string | undefined>) {
		const url = new SvelteURL(page.url);

		for (const [key, value] of Object.entries(params)) {
			if (value) {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		}

		// Reset page to 1 when changing filters, unless page is explicitly passed
		if (url.searchParams.get('page') && !params.page) {
			url.searchParams.set('page', '1');
		}

		goto(url.toString(), { keepFocus: true, noScroll: true, replaceState: true });
	}

	function updateSearch(query: string) {
		updateUrl({ search: query });
	}

	return {
		getParam,
		updateUrl,
		updateSearch
	};
}
