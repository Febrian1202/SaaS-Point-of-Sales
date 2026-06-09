<script lang="ts">
	import { api } from '$lib/api/client';

	let searchQuery = $state('');
	let searchResults: any[] = $state([]);
	let isLoading = $state(false);

	async function searchProducts() {
		if (searchQuery.length < 3) return;

		isLoading = true;
		const token = localStorage.getItem('accessToken');

		const { data, error } = await api.products.index.get({
			$query: {
				search: searchQuery
			},
			$headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!error && (data as any)?.success) {
			searchResults = (data as any).data || [];
		}

		isLoading = false;
	}
</script>

<input
	type="text"
	bind:value={searchQuery}
	oninput={searchProducts}
	placeholder="Cari produk (min 3 huruf)..."
	class="rounded border p-2"
/>

{#if isLoading}
	<p>Mencari...</p>
{:else}
	<ul>
		{#each searchResults as item}
			<li>{item.name} - Sisa Stok: {item.stockQty}</li>
		{/each}
	</ul>
{/if}
