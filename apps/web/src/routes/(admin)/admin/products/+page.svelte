<script lang="ts">
	import { Search, Plus, RefreshCw, Edit2, Trash2 } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import { getCoreRowModel, type ColumnDef } from '@tanstack/table-core';
	import { renderSnippet } from '$lib/components/ui/data-table/render-helpers.js';
	import * as Table from '$lib/components/ui/table';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Check, ChevronsUpDown } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { formatRupiah } from '$lib/utils/index';
	import { isBarcode } from '$lib/utils/index';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import ProductDialog from '$lib/features/admin/product/ProductDialog.svelte';
	import DeleteConfirmDialog from '$lib/features/shared/DeleteConfirmDialog.svelte';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Pagination from '$lib/components/ui/pagination';

	// Props data
	let { data } = $props();

	// State untuk bind input search
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

	// State filter popover
	let openCategory = $state(false);
	let openStatus = $state(false);

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

	// Sync state saat URL berubah
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

	// Helper untuk handle filter
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

	function resetFilters() {
		searchQuery = '';
		selectedCategory = '';
		selectedStatus = '';

		goto('?', { keepFocus: true, noScroll: true });
	}

	function goToPage(newPage: number) {
		const urlParams = new SvelteURLSearchParams(page.url.searchParams);
		urlParams.set('page', newPage.toString());
		goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
	}

	$effect(() => {
		const query = searchQuery.trim();

		const timer = setTimeout(() => {
			const urlParams = new SvelteURLSearchParams(page.url.searchParams);

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

			goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
		}, 500);

		return () => clearTimeout(timer);
	});

	const statusList = [
		{ value: 'AVAILABLE', label: 'Tersedia' },
		{ value: 'LOW_STOCK', label: 'Stok Kurang' },
		{ value: 'OUT_OF_STOCK', label: 'Stok Habis' }
	];

	// Column Definition Setup
	const columns: ColumnDef<ProductItem>[] = [
		{
			accessorKey: 'barcode',
			header: 'Barcode',
			cell: ({ row }) => {
				return renderSnippet(barcodeSnippet, row.original);
			}
		},
		{
			accessorKey: 'name',
			header: 'Product Name',
			cell: ({ row }) => {
				return renderSnippet(nameSnippet, row.original);
			}
		},
		{
			id: 'category',
			header: 'Category',
			cell: ({ row }) => {
				return renderSnippet(categorySnippet, row.original);
			}
		},
		{
			accessorKey: 'sellingPrice',
			header: 'Price',
			cell: ({ row }) => {
				return renderSnippet(priceSnippet, row.original);
			}
		},
		{
			accessorKey: 'unit',
			header: 'Unit',
			cell: ({ row }) => {
				return renderSnippet(unitSnippet, row.original);
			}
		},
		{
			accessorKey: 'stockQty',
			header: 'Stock',
			cell: ({ row }) => {
				return renderSnippet(stockSnippet, row.original);
			}
		},
		{
			id: 'actions',
			header: 'Action',
			cell: ({ row }) => {
				return renderSnippet(actionsSnippet, row.original);
			}
		}
	];

	function initTable(products: ProductItem[]) {
		return createSvelteTable({
			get data() {
				return products;
			},
			columns,
			getCoreRowModel: getCoreRowModel()
		});
	}
</script>

<!-- Custom Cell Snippets -->
{#snippet barcodeSnippet(product: ProductItem)}
	<span class="font-mono text-sm">{product.barcode || '-'}</span>
{/snippet}

{#snippet nameSnippet(product: ProductItem)}
	{@const isLowStock = product.stockQty && product.stockQty <= 5}
	<span class="block font-semibold text-foreground">{product.name}</span>
	<span class="text-xs text-secondary-foreground">ID: {product.id}</span>
	{#if isLowStock}
		<span class="mt-1 flex items-center gap-1 text-[10px] text-destructive">
			<span class="h-1.5 w-1.5 rounded-full bg-destructive"></span> Stok Menipis
		</span>
	{/if}
{/snippet}

{#snippet categorySnippet(product: ProductItem)}
	<Badge
		variant="outline"
		class="border-border bg-background font-mono text-[10px] text-secondary-foreground uppercase"
	>
		{product.category?.name || '-'}
	</Badge>
{/snippet}

{#snippet priceSnippet(product: ProductItem)}
	<span class="font-mono text-sm">{formatRupiah(product.sellingPrice)}</span>
{/snippet}

{#snippet unitSnippet(product: ProductItem)}
	<span class="font-mono text-sm">{product.unit || '-'}</span>
{/snippet}

{#snippet stockSnippet(product: ProductItem)}
	{@const isLowStock = product.stockQty && product.stockQty <= 5}
	<div class="flex flex-col items-center gap-1.5">
		<span class="font-mono text-sm font-medium {isLowStock ? 'font-bold text-destructive' : ''}">
			{product.stockQty ?? 0}
		</span>
		<div class="h-1.5 w-12 overflow-hidden rounded-full bg-background">
			<div
				class="h-full {isLowStock ? 'bg-destructive' : 'bg-primary'}"
				style="width: {((product.stockQty ?? 0) / 100) * 100}%"
			></div>
		</div>
	</div>
{/snippet}

{#snippet actionsSnippet(product: ProductItem)}
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
{/snippet}

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

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
			<Popover.Root bind:open={openCategory}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							role="combobox"
							aria-expanded={openCategory}
							class="flex w-full min-w-0 items-center justify-between font-mono text-sm"
						>
							<span class="flex-1 truncate text-left">
								{#await data.streamed.categories}
									<span class="text-muted-foreground">Memuat...</span>
								{:then categories}
									{categories?.find((c) => c.slug === selectedCategory)?.name ?? 'Semua Kategori'}
								{/await}
							</span>
							<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-(--bits-popover-anchor-width) p-0">
					<Command.Root
						class="focus:outline-none focus-visible:outline-none **:data-[slot=command-input]:focus:ring-0 **:data-[slot=command-input]:focus-visible:ring-0 **:data-[slot=command-input-wrapper]:focus-within:ring-0"
					>
						<Command.Input
							class="h-9 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
							placeholder="Cari kategori..."
						/>
						<Command.List>
							<Command.Empty>Kategori tidak ditemukan.</Command.Empty>
							<Command.Group>
								<Command.Item
									value=""
									onSelect={() => {
										selectedCategory = '';
										handleFilterChange({ category: '' });
										openCategory = false;
									}}
								>
									<Check
										class="mr-2 h-4 w-4 {selectedCategory === '' ? 'opacity-100' : 'opacity-0'}"
									/>
									Semua Kategori
								</Command.Item>
								{#await data.streamed.categories then categories}
									{#each categories ?? [] as category (category.id)}
										<Command.Item
											value={category.slug}
											onSelect={() => {
												selectedCategory = category.slug;
												handleFilterChange({ category: category.slug });
												openCategory = false;
											}}
										>
											<Check
												class="mr-2 h-4 w-4 {selectedCategory === category.slug
													? 'opacity-100'
													: 'opacity-0'}"
											/>
											{category.name}
										</Command.Item>
									{/each}
								{/await}
							</Command.Group>
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
		</div>

		<!-- Status Stok -->
		<div class="min-w-50 flex-1 space-y-1.5">
			<span class="font-mono text-xs text-secondary-foreground">Status Stok</span>
			<Popover.Root bind:open={openStatus}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							role="combobox"
							aria-expanded={openStatus}
							class="flex w-full min-w-0 items-center justify-between font-mono text-sm"
						>
							<span class="flex-1 truncate text-left">
								{statusList.find((s) => s.value === selectedStatus)?.label ?? 'Semua Status'}
							</span>
							<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-(--bits-popover-anchor-width) p-0">
					<Command.Root
						class="focus:outline-none focus-visible:outline-none **:data-[slot=command-input]:focus:ring-0 **:data-[slot=command-input]:focus-visible:ring-0 **:data-[slot=command-input-wrapper]:focus-within:ring-0"
					>
						<Command.Input
							class="h-9 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
							placeholder="Cari status..."
						/>
						<Command.List>
							<Command.Empty>Status tidak ditemukan.</Command.Empty>
							<Command.Group>
								<Command.Item
									value=""
									onSelect={() => {
										selectedStatus = '';
										handleFilterChange({ status: '' });
										openStatus = false;
									}}
								>
									<Check
										class="mr-2 h-4 w-4 {selectedStatus === '' ? 'opacity-100' : 'opacity-0'}"
									/>
									Semua Status
								</Command.Item>
								{#each statusList as s (s.value)}
									<Command.Item
										value={s.value}
										onSelect={() => {
											selectedStatus = s.value;
											handleFilterChange({ status: s.value });
											openStatus = false;
										}}
									>
										<Check
											class="mr-2 h-4 w-4 {selectedStatus === s.value
												? 'opacity-100'
												: 'opacity-0'}"
										/>
										{s.label}
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
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
					{@const resolvedProducts = result?.data || []}
					{#if resolvedProducts.length > 0}
						{@const table = initTable(resolvedProducts)}
						{#each table.getRowModel().rows as row, rowIdx (row.id)}
							{@const isLowStock = row.original.stockQty && row.original.stockQty <= 5}
							<Table.Row
								class="group animate-in transition-colors fade-in slide-in-from-bottom-1 {isLowStock
									? 'bg-destructive/5 hover:bg-destructive/10'
									: 'hover:bg-muted/50'}"
								style="animation-delay: {rowIdx * 40}ms; animation-fill-mode: both;"
							>
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell
										class={cell.column.id === 'sellingPrice'
											? 'text-right'
											: cell.column.id === 'unit' ||
												  cell.column.id === 'stockQty' ||
												  cell.column.id === 'actions'
												? 'text-center'
												: ''}
									>
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/each}
							</Table.Row>
						{/each}
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
					{/if}
				{/await}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Pagination -->
	<div class="flex items-center justify-between">
		{#await data.streamed.products}
			<p class="font-mono text-xs text-secondary-foreground">Menampilkan - hingga - dari - hasil</p>
		{:then result}
			{@const meta = result?.meta}
			{@const hasData = meta && meta.totalData > 0}

			{#if hasData}
				<p class="font-mono text-xs text-secondary-foreground">
					Menampilkan {(meta.page - 1) * meta.limit + 1} hingga {Math.min(
						meta.page * meta.limit,
						meta.totalData
					)} dari {meta.totalData} hasil
				</p>
				<Pagination.Root
					count={meta.totalData}
					perPage={meta.limit}
					page={meta.page}
					siblingCount={1}
					class="mx-0 w-auto"
				>
					{#snippet children({ pages, currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.PrevButton
									disabled={meta.page <= 1}
									onclick={() => goToPage(meta.page - 1)}
								/>
							</Pagination.Item>
							{#each pages as page (page.key)}
								{#if page.type === 'ellipsis'}
									<Pagination.Item>
										<Pagination.Ellipsis />
									</Pagination.Item>
								{:else}
									<Pagination.Item>
										<Pagination.Link
											{page}
											isActive={currentPage === page.value}
											onclick={() => goToPage(page.value)}
										/>
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Pagination.NextButton
									disabled={meta.page >= meta.totalPages}
									onclick={() => goToPage(meta.page + 1)}
								/>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			{/if}
		{/await}
	</div>
</div>

{#await data.streamed.categories then categories}
	<ProductDialog bind:open={showAdd} categories={categories ?? []} product={editingProduct} />
{/await}

<DeleteConfirmDialog bind:open={showDelete} itemName={targetName} onConfirm={handleDelete} />
