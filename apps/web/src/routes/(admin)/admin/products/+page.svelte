<script lang="ts">
	import { Search, Plus, RefreshCw, Edit2, Trash2 } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { formatRupiah } from '$lib/utils/index';
	import { isBarcode } from '$lib/utils/index';
	import { getVisiblePages } from '$lib/utils/shared';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import ProductDialog from '$lib/features/admin/product/ProductDialog.svelte';
	import DeleteConfirmDialog from '$lib/features/shared/DeleteConfirmDialog.svelte';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';

	// Props data
	let { data } = $props();

	// State untuk bind input search — diinisialisasi dari URL dan di-sync ulang saat navigasi
	let searchQuery = $state(
		page.url.searchParams.get('search') || page.url.searchParams.get('barcode') || ''
	);
	let selectedCategory = $state(page.url.searchParams.get('category') ?? '');
	let selectedStatus = $state(page.url.searchParams.get('status') ?? '');

	type ProductItem = {
		id: string;
		name: string;
		barcode?: string | null;
		sellingPrice: string | number;
		stockQty?: number | null;
		unit?: string | null;
		category?: {
			name: string;
		} | null;
	};

	// State untuk Dialog
	let showAdd = $state(false);
	let showDelete = $state(false);
	let targetId = $state('');
	let targetName = $state('');
	let editingProduct = $state<ProductItem | null>(null);

	async function handleDelete() {
		const formData = new FormData();
		formData.append('id', targetId);

		const response = await fetch('?/delete', {
			method: 'POST',
			body: formData
		});

		const result = deserialize(await response.text());
		if (result.type === 'success') {
			toast.success(`Produk ${targetName} berhasil dihapus.`);
			await invalidateAll();
		} else if (result.type === 'failure') {
			const data = result.data as { message?: string } | undefined;
			toast.error(data?.message || 'Gagal menghapus produk.');
		} else if (result.type === 'error') {
			toast.error('Terjadi kesalahan pada sistem.');
		}
	}

	// Sync state saat URL berubah (misalnya saat navigasi via sidebar / back button)
	let prevUrl = $state(page.url.toString());
	$effect(() => {
		const currentUrl = page.url.toString();
		if (currentUrl !== prevUrl) {
			prevUrl = currentUrl;
			searchQuery =
				page.url.searchParams.get('search') || page.url.searchParams.get('barcode') || '';
			selectedCategory = page.url.searchParams.get('category') ?? '';
			selectedStatus = page.url.searchParams.get('status') ?? '';
		}
	});

	// Helper untuk handle filter — bisa dipanggil setelah state diubah atau langsung menerima value baru
	function handleFilterChange(patch: { category?: string; status?: string } = {}) {
		const urlParams = new SvelteURLSearchParams(page.url.searchParams);

		const cat = 'category' in patch ? patch.category : selectedCategory;
		const st = 'status' in patch ? patch.status : selectedStatus;

		if (cat) urlParams.set('category', cat);
		else urlParams.delete('category');

		if (st) urlParams.set('status', st);
		else urlParams.delete('status');

		urlParams.delete('page');

		goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
	}

	// Handler reset
	function resetFilters() {
		searchQuery = '';
		selectedCategory = '';
		selectedStatus = '';

		goto('?', { keepFocus: true, noScroll: true });
	}

	// Fungsi pagination
	function goToPage(newPage: number) {
		const urlParams = new SvelteURLSearchParams(page.url.searchParams);
		urlParams.set('page', newPage.toString());
		goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
	}

	$effect(() => {
		const query = searchQuery.trim();

		const timer = setTimeout(() => {
			const urlParams = new SvelteURLSearchParams(page.url.searchParams);

			// Hapus kedua params
			urlParams.delete('search');
			urlParams.delete('barcode');

			const isQueryChanged =
				(isBarcode(query) && query !== page.url.searchParams.get('barcode')) ||
				(!isBarcode(query) && query !== page.url.searchParams.get('search'));

			if (query) {
				if (isBarcode(query)) {
					urlParams.set('barcode', query);
				} else {
					urlParams.set('search', query);
				}
			}

			if (isQueryChanged) {
				urlParams.delete('page');
			}

			// Navigasi diam-diam
			goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
		}, 500);

		return () => clearTimeout(timer);
	});

	const status = [
		{ value: 'AVAILABLE', label: 'Tersedia' },
		{ value: 'LOW_STOCK', label: 'Stok Kurang' },
		{ value: 'OUT_OF_STOCK', label: 'Stok Habis' }
	];
</script>

<div
	class="flex-1 animate-in space-y-6 overflow-y-auto duration-500 fade-in slide-in-from-bottom-3"
>
	<!-- Header Section -->
	<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
		<div>
			<h3 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Daftar Produk
			</h3>
			<p class="text-sm text-secondary-foreground">Kelola inventaris barang dan stok toko Anda.</p>
		</div>
		<Button
			class="gap-2"
			onclick={() => {
				editingProduct = null;
				showAdd = true;
			}}
		>
			<Plus class="h-4 w-4" />
			<span class="font-mono text-sm">Tambah Baru</span>
		</Button>
	</div>

	<!-- Filter Row -->
	<div
		class="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm"
	>
		<!-- Kategori -->
		<div class="min-w-50 flex-1 space-y-1.5">
			<span class="font-mono text-xs text-secondary-foreground">Kategori</span>
			<Select.Root
				type="single"
				value={selectedCategory}
				onValueChange={(val) => {
					selectedCategory = val;
					handleFilterChange({ category: val });
				}}
			>
				<Select.Trigger
					class="flex w-full min-w-0 items-center justify-between font-mono text-sm"
					aria-label="Filter kategori"
				>
					<span class="flex-1 truncate pr-2 text-left">
						{#await data.streamed.categories}
							<span class="text-muted-foreground">Memuat...</span>
						{:then categories}
							{categories?.find((c) => c.slug === selectedCategory)?.name ?? 'Semua Kategori'}
						{/await}
					</span>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="" label="Semua Kategori" />
					{#await data.streamed.categories then categories}
						{#each categories ?? [] as category (category.id)}
							<Select.Item value={category.slug} label={category.name} />
						{/each}
					{/await}
				</Select.Content>
			</Select.Root>
		</div>

		<!-- Status Stok -->
		<div class="min-w-50 flex-1 space-y-1.5">
			<span class="font-mono text-xs text-secondary-foreground">Status Stok</span>
			<Select.Root
				type="single"
				value={selectedStatus}
				onValueChange={(val) => {
					selectedStatus = val;
					handleFilterChange({ status: val });
				}}
			>
				<Select.Trigger class="w-full font-mono text-sm" aria-label="Filter status stok">
					{status.find((s) => s.value === selectedStatus)?.label ?? 'Semua Status'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="" label="Semua Status" />
					{#each status as s (s.value)}
						<Select.Item value={s.value} label={s.label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<!-- Pencarian Cepat -->
		<div class="min-w-75 flex-2 space-y-1.5">
			<label for="search" class="font-mono text-xs text-secondary-foreground">Pencarian Cepat</label
			>
			<div class="relative">
				<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					id="search"
					bind:value={searchQuery}
					type="text"
					placeholder="Masukkan nama atau barcode..."
					class="pl-9 font-sans text-sm"
				/>
			</div>
		</div>

		<Button
			variant="outline"
			onclick={resetFilters}
			class="gap-2 border-border text-secondary-foreground"
		>
			<RefreshCw class="h-4 w-4" />
			<span class="font-mono text-xs">Reset Filter</span>
		</Button>
	</div>

	<!-- Data Table Container -->
	<div class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
		<Table.Root>
			<Table.Header>
				<Table.Row class="border-b border-border bg-background hover:bg-background">
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Barcode</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Product Name</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Category</Table.Head
					>
					<Table.Head class="text-right font-mono text-xs text-secondary-foreground uppercase"
						>Price</Table.Head
					>
					<Table.Head class="text-center font-mono text-xs text-secondary-foreground uppercase"
						>Unit</Table.Head
					>
					<Table.Head class="text-center font-mono text-xs text-secondary-foreground uppercase"
						>Stock</Table.Head
					>
					<Table.Head class="text-center font-mono text-xs text-secondary-foreground uppercase"
						>Action</Table.Head
					>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#await data.streamed.products}
					{#each Array.from({ length: 10 }, (_, i) => i) as i (i)}
						<Table.Row>
							<Table.Cell><Skeleton class="h-4 w-25" /></Table.Cell>
							<Table.Cell>
								<Skeleton class="mb-1 h-5 w-50" />
								<Skeleton class="h-3 w-37.5" />
							</Table.Cell>
							<Table.Cell><Skeleton class="h-5 w-20 rounded-full" /></Table.Cell>
							<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-30" /></Table.Cell>
							<Table.Cell><Skeleton class="mx-auto h-4 w-12" /></Table.Cell>
							<Table.Cell>
								<div class="flex flex-col items-center gap-1.5">
									<Skeleton class="h-4 w-6" />
									<Skeleton class="h-1.5 w-12 rounded-full" />
								</div>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center justify-center gap-1">
									<Skeleton class="h-8 w-8 rounded-md" />
									<Skeleton class="h-8 w-8 rounded-md" />
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				{:then result}
					{#each result?.data as product, rowIdx (product.id)}
						{@const isLowStock = product.stockQty && product.stockQty <= 5}
						<Table.Row
							class="group animate-in transition-colors fade-in slide-in-from-bottom-1 {isLowStock
								? 'bg-destructive/5 hover:bg-destructive/10'
								: 'hover:bg-muted/50'}"
							style="animation-delay: {rowIdx * 40}ms; animation-fill-mode: both;"
						>
							<Table.Cell class="font-mono text-sm">{product.barcode}</Table.Cell>
							<Table.Cell>
								<span class="block font-semibold text-foreground">{product.name}</span>
								<span class="text-xs text-secondary-foreground">ID: {product.id}</span>
								{#if isLowStock}
									<span class="mt-1 flex items-center gap-1 text-[10px] text-destructive">
										<span class="h-1.5 w-1.5 rounded-full bg-destructive"></span> Stok Menipis
									</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<Badge
									variant="outline"
									class="border-border bg-background font-mono text-[10px] text-secondary-foreground uppercase"
								>
									{product.category.name}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm"
								>{formatRupiah(product.sellingPrice)}</Table.Cell
							>
							<Table.Cell class="text-center font-mono text-sm">
								{product.unit || '-'}
							</Table.Cell>
							<Table.Cell>
								<div class="flex flex-col items-center gap-1.5">
									<span
										class="font-mono text-sm font-medium {isLowStock
											? 'font-bold text-destructive'
											: ''}"
									>
										{product.stockQty}
									</span>
									<div class="h-1.5 w-12 overflow-hidden rounded-full bg-background">
										<div
											class="h-full {isLowStock ? 'bg-destructive' : 'bg-primary'}"
											style="width: {((product.stockQty ?? 0) / 100) * 100}%"
										></div>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center justify-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										class="h-8 w-8 text-secondary-foreground hover:text-primary"
										onclick={() => {
											editingProduct = product;
											showAdd = true;
										}}
									>
										<Edit2 class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="h-8 w-8 text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
										onclick={() => {
											targetId = product.id;
											targetName = product.name;
											showDelete = true;
										}}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={7} class="h-24 text-center">
								<div
									class="flex flex-col items-center justify-center gap-2 text-secondary-foreground"
								>
									<p class="font-mono text-sm">Tidak ada produk ditemukan.</p>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/await}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Pagination -->
	<div class="flex items-center justify-between">
		{#await data.streamed.products}
			<p class="font-mono text-xs text-secondary-foreground">Showing - to - of - results</p>
		{:then result}
			{@const meta = result?.meta}
			{@const hasData = meta && meta.totalData > 0}

			{#if hasData}
				<p class="font-mono text-xs text-secondary-foreground">
					Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(
						meta.page * meta.limit,
						meta.totalData
					)} of {meta.totalData} results
				</p>
				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						class="h-8 w-8 border-border"
						disabled={meta.page <= 1}
						onclick={() => goToPage(meta.page - 1)}
					>
						<span class="sr-only">Previous page</span>
						&lt;
					</Button>

					{#each getVisiblePages(meta.page, meta.totalPages) as page (page)}
						<Button
							variant={page === meta.page ? 'default' : 'outline'}
							class="h-8 w-8 p-0 text-xs {page === meta.page
								? 'bg-primary text-primary-foreground hover:bg-primary/90'
								: 'border-border text-secondary-foreground hover:bg-muted hover:text-foreground'}"
							onclick={() => goToPage(page)}
						>
							{page}
						</Button>
					{/each}

					{#if meta.totalPages > 5 && meta.page < meta.totalPages - 2}
						<span class="px-2 text-secondary-foreground">...</span>
						<Button
							variant="outline"
							size="icon"
							class="h-8 w-8 border-border"
							onclick={() => goToPage(meta.totalPages)}
						>
							{meta.totalPages}
						</Button>
					{/if}

					<Button
						variant="outline"
						size="icon"
						class="h-8 w-8 border-border"
						disabled={meta.page >= meta.totalPages}
						onclick={() => goToPage(meta.page + 1)}
					>
						<span class="sr-only">Next page</span>
						&gt;
					</Button>
				</div>
			{/if}
		{/await}
	</div>
</div>

{#await data.streamed.categories then categories}
	<ProductDialog bind:open={showAdd} categories={categories ?? []} product={editingProduct} />
{/await}

<DeleteConfirmDialog bind:open={showDelete} itemName={targetName} onConfirm={handleDelete} />
