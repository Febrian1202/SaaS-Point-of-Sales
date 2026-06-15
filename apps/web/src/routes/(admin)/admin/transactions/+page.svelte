<script lang="ts">
	import { Search, RefreshCw, Eye, Ban, CalendarIcon } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import { getCoreRowModel, type ColumnDef } from '@tanstack/table-core';
	import { renderSnippet } from '$lib/components/ui/data-table/render-helpers.js';
	import * as Table from '$lib/components/ui/table';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import * as Popover from '$lib/components/ui/popover';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { formatRupiah } from '$lib/utils/index';
	import { cn } from '$lib/utils';
	import { getVisiblePages } from '$lib/utils/shared';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import DeleteConfirmDialog from '$lib/features/shared/DeleteConfirmDialog.svelte';
	import TransactionDetailDialog from '$lib/features/admin/transactions/TransactionDetailDialog.svelte';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import {
		DateFormatter,
		type DateValue,
		getLocalTimeZone,
		parseDate
	} from '@internationalized/date';

	let { data } = $props();

	const currentUser = $derived(data?.user);

	// Formatter untuk date
	const df = new DateFormatter('id-ID', {
		dateStyle: 'medium'
	});

	// State pencarian
	let searchQuery = $state(page.url.searchParams.get('search') || '');

	// State filter range calendar
	let openDateRange = $state(false);

	let initFrom = page.url.searchParams.get('from');
	let initTo = page.url.searchParams.get('to');

	let dateRange = $state({
		start: initFrom ? parseDate(initFrom) : undefined,
		end: initTo ? parseDate(initTo) : undefined
	});

	// Handle Date Range Change
	function handleDateRangeChange(range: { start?: DateValue; end?: DateValue }) {
		dateRange = range;
		const urlParams = new SvelteURLSearchParams(page.url.searchParams);

		if (range.start) {
			urlParams.set('from', range.start.toString());
		} else {
			urlParams.delete('from');
		}

		if (range.end) {
			urlParams.set('to', range.end.toString());
		} else {
			urlParams.delete('to');
		}

		urlParams.delete('page');
		goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
	}

	// State dialog void
	let showVoid = $state(false);
	let targetId = $state('');
	let targetNumber = $state('');

	// State dialog detail
	let showDetail = $state(false);
	let detailTargetId = $state('');

	async function handleVoid() {
		const formData = new FormData();
		formData.append('id', targetId);

		const response = await fetch('?/void', {
			method: 'POST',
			body: formData
		});

		const result = deserialize(await response.text());
		if (result.type === 'success') {
			toast.success(`Transaksi ${targetNumber} berhasil dibatalkan (void).`);
			await invalidateAll();
		} else if (result.type === 'failure') {
			const data = result.data as { message?: string } | undefined;
			toast.error(data?.message || 'Gagal membatalkan transaksi.');
		} else if (result.type === 'error') {
			toast.error('Terjadi kesalahan pada sistem.');
		}
	}

	// Sync input saat URL berubah
	let prevUrl = $state(page.url.toString());
	$effect(() => {
		const currentUrl = page.url.toString();
		if (currentUrl !== prevUrl) {
			prevUrl = currentUrl;
			searchQuery = page.url.searchParams.get('search') || '';
		}
	});

	// Reset pencarian
	function resetFilters() {
		searchQuery = '';
		dateRange = { start: undefined, end: undefined };
		goto('?', { keepFocus: true, noScroll: true });
	}

	// Pagination
	function goToPage(newPage: number) {
		const urlParams = new SvelteURLSearchParams(page.url.searchParams);
		urlParams.set('page', newPage.toString());
		goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
	}

	// Debounce pencarian
	$effect(() => {
		const query = searchQuery.trim();

		const timer = setTimeout(() => {
			const urlParams = new SvelteURLSearchParams(page.url.searchParams);
			const isQueryChanged = query !== page.url.searchParams.get('search');

			if (query) {
				urlParams.set('search', query);
			} else {
				urlParams.delete('search');
			}

			if (isQueryChanged) {
				urlParams.delete('page');
				goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
			}
		}, 500);

		return () => clearTimeout(timer);
	});

	// Format tanggal waktu (e.g. 31/05 14:22)
	function formatTrxDate(dateStr: string | Date) {
		const d = new Date(dateStr);
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		return `${day}/${month} ${hours}:${minutes}`;
	}

	type TrxItem = {
		qty: number | null;
		product: { name: string } | null;
	};

	function getTrxProducts(items: TrxItem[]) {
		if (!items || items.length === 0) return '-';
		return items.map((i) => i.product?.name || 'Produk').join(', ');
	}

	function countTrxItems(items: TrxItem[]) {
		if (!items) return 0;
		return items.reduce((sum, item) => sum + (item.qty || 0), 0);
	}

	type TransactionItem = {
		id: string;
		trxNumber: string;
		cashier?: { name: string } | null;
		items: TrxItem[];
		totalAmount: number | string;
		createdAt: string | Date;
		status: string;
	};

	// Column Definition Setup
	const columns: ColumnDef<TransactionItem>[] = [
		{
			accessorKey: 'trxNumber',
			header: 'No. Struk',
			cell: ({ row }) => renderSnippet(trxNumberSnippet, row.original)
		},
		{
			accessorKey: 'cashier.name',
			header: 'Kasir',
			cell: ({ row }) => renderSnippet(cashierSnippet, row.original)
		},
		{
			id: 'products',
			header: 'Produk',
			cell: ({ row }) => renderSnippet(productsSnippet, row.original)
		},
		{
			accessorKey: 'totalAmount',
			header: 'Total',
			cell: ({ row }) => renderSnippet(totalAmountSnippet, row.original)
		},
		{
			id: 'itemCount',
			header: 'Item',
			cell: ({ row }) => renderSnippet(itemCountSnippet, row.original)
		},
		{
			accessorKey: 'createdAt',
			header: 'Tgl & Waktu',
			cell: ({ row }) => renderSnippet(createdAtSnippet, row.original)
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => renderSnippet(statusSnippet, row.original)
		},
		{
			id: 'actions',
			header: 'Aksi',
			cell: ({ row }) => renderSnippet(actionsSnippet, row.original)
		}
	];

	function initTable(transactions: TransactionItem[]) {
		return createSvelteTable({
			get data() {
				return transactions;
			},
			columns,
			getCoreRowModel: getCoreRowModel()
		});
	}
</script>

<!-- Custom Cell Snippets -->
{#snippet trxNumberSnippet(trx: TransactionItem)}
	<span class="font-mono text-sm font-semibold">{trx.trxNumber}</span>
{/snippet}

{#snippet cashierSnippet(trx: TransactionItem)}
	<span class="text-sm">{trx.cashier?.name || '-'}</span>
{/snippet}

{#snippet productsSnippet(trx: TransactionItem)}
	<span class="max-w-xs truncate text-sm">{getTrxProducts(trx.items)}</span>
{/snippet}

{#snippet totalAmountSnippet(trx: TransactionItem)}
	<span class="font-mono text-sm">{formatRupiah(trx.totalAmount)}</span>
{/snippet}

{#snippet itemCountSnippet(trx: TransactionItem)}
	<span class="font-mono text-sm">{countTrxItems(trx.items)}</span>
{/snippet}

{#snippet createdAtSnippet(trx: TransactionItem)}
	<span class="font-mono text-sm">{formatTrxDate(trx.createdAt)}</span>
{/snippet}

{#snippet statusSnippet(trx: TransactionItem)}
	<Badge
		variant={trx.status === 'void' ? 'destructive' : 'outline'}
		class="border-border bg-background font-mono text-[9px] font-bold uppercase select-none"
	>
		{trx.status}
	</Badge>
{/snippet}

{#snippet actionsSnippet(trx: TransactionItem)}
	<div class="flex items-center justify-center gap-1">
		<HoverCard.Root openDelay={0} closeDelay={100}>
			<HoverCard.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon"
						class="group/btn h-8 w-8 text-secondary-foreground hover:bg-primary/10"
						onclick={() => {
							detailTargetId = trx.id;
							showDetail = true;
						}}
					>
						<Eye class="h-4 w-4 transition-colors group-hover/btn:text-primary" />
					</Button>
				{/snippet}
			</HoverCard.Trigger>
			<HoverCard.Content
				class="z-50 w-auto rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 shadow-xl backdrop-blur-md"
				side="top"
				align="center"
				sideOffset={5}
			>
				<span class="font-mono text-[10px] tracking-wider text-primary uppercase">Lihat Detail</span
				>
			</HoverCard.Content>
		</HoverCard.Root>

		{#if currentUser?.role === 'admin' && trx.status !== 'void'}
			<HoverCard.Root openDelay={0} closeDelay={100}>
				<HoverCard.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="icon"
							class="group/btn h-8 w-8 text-secondary-foreground hover:bg-destructive/10"
							onclick={() => {
								targetId = trx.id;
								targetNumber = trx.trxNumber;
								showVoid = true;
							}}
						>
							<Ban class="h-4 w-4 transition-colors group-hover/btn:text-destructive" />
						</Button>
					{/snippet}
				</HoverCard.Trigger>
				<HoverCard.Content
					class="z-50 w-auto rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 shadow-xl backdrop-blur-md"
					side="top"
					align="center"
					sideOffset={5}
				>
					<span class="font-mono text-[10px] tracking-wider text-destructive uppercase"
						>Void (Admin Only)</span
					>
				</HoverCard.Content>
			</HoverCard.Root>
		{:else}
			<div class="h-8 w-8"></div>
		{/if}
	</div>
{/snippet}

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div
	class="flex-1 animate-in space-y-6 overflow-y-auto duration-500 fade-in slide-in-from-bottom-3"
>
	<!-- Page Title Section -->
	<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
		<div>
			<h3 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Riwayat Transaksi
			</h3>
			<p class="text-sm text-secondary-foreground">
				Sistem pemantauan dan audit untuk catatan penjualan harian.
			</p>
		</div>
	</div>

	<!-- Filter Controls -->
	<div
		class="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm"
	>
		<!-- Date Range Calendar -->
		<div class="min-w-64 flex-1 space-y-1.5">
			<span class="font-mono text-xs text-secondary-foreground uppercase">Rentang Waktu</span>
			<Popover.Root bind:open={openDateRange}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button
							variant="outline"
							class={cn(
								'w-full justify-start text-left font-mono font-normal',
								!dateRange.start && 'text-muted-foreground'
							)}
							{...props}
						>
							<CalendarIcon class="mr-2 h-4 w-4" />
							{#if dateRange.start}
								{#if dateRange.end}
									{df.format(dateRange.start.toDate(getLocalTimeZone()))} - {df.format(
										dateRange.end.toDate(getLocalTimeZone())
									)}
								{:else}
									{df.format(dateRange.start.toDate(getLocalTimeZone()))}
								{/if}
							{:else}
								Pilih Rentang Tanggal
							{/if}
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0" align="start">
					<RangeCalendar
						value={dateRange}
						onValueChange={handleDateRangeChange}
						initialFocus
						numberOfMonths={2}
						placeholder={dateRange?.start}
					/>
				</Popover.Content>
			</Popover.Root>
		</div>

		<!-- Search by Invoice -->
		<div class="min-w-75 flex-2 space-y-1.5">
			<label for="search" class="font-mono text-xs text-secondary-foreground uppercase"
				>Cari berdasarkan Struk</label
			>
			<div class="relative">
				<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					id="search"
					bind:value={searchQuery}
					type="text"
					placeholder="Cari No. Struk / Invoice..."
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
			<span class="font-mono text-xs">Reset</span>
		</Button>
	</div>

	<!-- Transaction Table Container -->
	<div class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
		<Table.Root>
			<Table.Header>
				<Table.Row class="border-b border-border bg-background hover:bg-background">
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>No. Struk</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Kasir</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Produk</Table.Head
					>
					<Table.Head class="text-right font-mono text-xs text-secondary-foreground uppercase"
						>Total</Table.Head
					>
					<Table.Head class="text-center font-mono text-xs text-secondary-foreground uppercase"
						>Item</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Tgl & Waktu</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Status</Table.Head
					>
					<Table.Head class="text-center font-mono text-xs text-secondary-foreground uppercase"
						>Aksi</Table.Head
					>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#await data.streamed.transactions}
					{#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
						<Table.Row>
							<Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-16" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-40" /></Table.Cell>
							<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-24" /></Table.Cell>
							<Table.Cell><Skeleton class="mx-auto h-4 w-8" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
							<Table.Cell><Skeleton class="h-5 w-16 rounded-full" /></Table.Cell>
							<Table.Cell>
								<div class="flex items-center justify-center gap-1">
									<Skeleton class="h-8 w-8 rounded-md" />
									<Skeleton class="h-8 w-8 rounded-md" />
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				{:then result}
					{@const resolvedTransactions = result?.data || []}
					{#if resolvedTransactions.length > 0}
						{@const table = initTable(resolvedTransactions)}
						{#each table.getRowModel().rows as row, rowIdx (row.id)}
							{@const isVoided = row.original.status === 'void'}
							<Table.Row
								class="group animate-in transition-colors fade-in slide-in-from-bottom-1 {isVoided
									? 'bg-destructive/5 text-muted-foreground line-through hover:bg-destructive/10'
									: 'hover:bg-muted/50'}"
								style="animation-delay: {rowIdx * 40}ms; animation-fill-mode: both;"
							>
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell
										class={cell.column.id === 'totalAmount'
											? 'text-right'
											: cell.column.id === 'itemCount' || cell.column.id === 'actions'
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
							<Table.Cell colspan={8} class="h-24 text-center">
								<div
									class="flex flex-col items-center justify-center gap-2 text-secondary-foreground"
								>
									<p class="font-mono text-sm">Tidak ada transaksi ditemukan.</p>
								</div>
							</Table.Cell>
						</Table.Row>
					{/if}
				{/await}
			</Table.Body>
		</Table.Root>

		<!-- Footer Legend & Info (Removed) -->
	</div>

	<!-- Pagination -->
	<div class="flex items-center justify-between">
		{#await data.streamed.transactions}
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

	<!-- Bento Status Section -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<!-- Total Omset Hari Ini -->
		<div
			class="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-sm"
		>
			<span class="font-mono text-xs text-secondary-foreground uppercase">Total Omset Hari Ini</span
			>
			<div class="mt-4">
				{#await data.streamed.dailyStats}
					<Skeleton class="h-8 w-36" />
					<Skeleton class="mt-2 h-4 w-24" />
				{:then dailyStats}
					<h3 class="font-tight text-2xl font-bold text-foreground">
						{formatRupiah(dailyStats?.retailRevenue || 0)}
					</h3>
					<p class="mt-1 font-mono text-[10px] text-muted-foreground">Retail & BRILink</p>
				{/await}
			</div>
		</div>

		<!-- Transaksi Berhasil -->
		<div
			class="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-sm"
		>
			<span class="font-mono text-xs text-secondary-foreground uppercase">Transaksi Berhasil</span>
			<div class="mt-4">
				{#await data.streamed.dailyStats}
					<Skeleton class="h-8 w-20" />
					<Skeleton class="mt-2 h-4 w-16" />
				{:then dailyStats}
					<h3 class="font-tight text-2xl font-bold text-foreground">
						{dailyStats?.trxCount || 0}
					</h3>
					<p class="mt-1 font-mono text-[10px] text-muted-foreground">Hari Ini</p>
				{/await}
			</div>
		</div>

		<!-- System Health (Removed) -->
	</div>
</div>

<DeleteConfirmDialog bind:open={showVoid} itemName={targetNumber} onConfirm={handleVoid} />
<TransactionDetailDialog bind:open={showDetail} transactionId={detailTargetId} />
