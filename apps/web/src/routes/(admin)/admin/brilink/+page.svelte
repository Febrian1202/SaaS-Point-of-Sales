<script lang="ts">
	import {
		Coins,
		Wallet,
		ArrowRightLeft,
		Calendar,
		RefreshCw,
		Check,
		ChevronsUpDown,
		Eye,
		Ban
	} from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import { getCoreRowModel, type ColumnDef } from '@tanstack/table-core';
	import { renderSnippet } from '$lib/components/ui/data-table/render-helpers.js';
	import * as Table from '$lib/components/ui/table';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { formatRupiah } from '$lib/utils/index';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import DeleteConfirmDialog from '$lib/features/shared/DeleteConfirmDialog.svelte';
	import BrilinkDetailDialog from '$lib/features/admin/brilink/BrilinkDetailDialog.svelte';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Pagination from '$lib/components/ui/pagination';
	import { Calendar as CalendarUI } from '$lib/components/ui/calendar';
	import {
		DateFormatter,
		type DateValue,
		getLocalTimeZone,
		parseDate
	} from '@internationalized/date';
	import { cn } from '$lib/utils';

	// Props data
	let { data } = $props();

	const currentUser = $derived(data?.user);

	// Formatter untuk date
	const df = new DateFormatter('id-ID', {
		dateStyle: 'medium'
	});

	// State filter
	let selectedDateStr = $state(page.url.searchParams.get('date') ?? '');
	let selectedDateValue = $state<DateValue | undefined>();
	let selectedType = $state(page.url.searchParams.get('type') ?? '');

	$effect(() => {
		if (selectedDateStr) {
			selectedDateValue = parseDate(selectedDateStr);
		} else {
			selectedDateValue = undefined;
		}
	});

	let openDate = $state(false);
	let openType = $state(false);

	// State untuk Dialog
	let showVoid = $state(false);
	let targetId = $state('');
	let targetRef = $state('');
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
			toast.success(`Transaksi ${targetRef} berhasil di-void.`);
			await invalidateAll();
		} else if (result.type === 'failure') {
			const data = result.data as { message?: string } | undefined;
			toast.error(data?.message || 'Gagal membatalkan transaksi.');
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
			selectedDateStr = page.url.searchParams.get('date') ?? '';
			selectedDateValue = selectedDateStr ? parseDate(selectedDateStr) : undefined;
			selectedType = page.url.searchParams.get('type') ?? '';
		}
	});

	// Handler filter change
	function handleFilterChange(patch: { date?: string; type?: string } = {}) {
		const urlParams = new SvelteURLSearchParams(page.url.searchParams);

		const dt = 'date' in patch ? patch.date : selectedDateStr;
		const tp = 'type' in patch ? patch.type : selectedType;

		if (dt) urlParams.set('date', dt);
		else urlParams.delete('date');

		if (tp) urlParams.set('type', tp);
		else urlParams.delete('type');

		urlParams.delete('page');

		goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
	}

	function resetFilters() {
		selectedDateStr = '';
		selectedDateValue = undefined;
		selectedType = '';
		goto('?', { keepFocus: true, noScroll: true });
	}

	// Fungsi pagination
	function goToPage(newPage: number) {
		const urlParams = new SvelteURLSearchParams(page.url.searchParams);
		urlParams.set('page', newPage.toString());
		goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
	}

	// Helper format tgl
	function formatDateTime(isoString: Date | string | null | undefined) {
		if (!isoString) return '-';
		const d = new Date(isoString);
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		return `${day}/${month} ${hours}:${minutes}`;
	}

	// Mapping tipe transaksi (Adhering to single-accent Graphite theme)
	const typeLabels: Record<string, { label: string; color: string }> = {
		transfer: { label: 'Transfer', color: 'border-border bg-surface text-foreground' },
		tarik_tunai: {
			label: 'Tarik Tunai',
			color: 'border-border bg-surface text-foreground'
		},
		pembayaran: {
			label: 'Pembayaran',
			color: 'border-border bg-surface text-foreground'
		},
		'e-wallet': { label: 'E-Wallet', color: 'border-border bg-surface text-foreground' },
		other: { label: 'Lainnya', color: 'border-muted bg-muted text-muted-foreground' }
	};

	const typesList = [
		{ value: 'transfer', label: 'Transfer' },
		{ value: 'tarik_tunai', label: 'Tarik Tunai' },
		{ value: 'pembayaran', label: 'Pembayaran' },
		{ value: 'e-wallet', label: 'E-Wallet' },
		{ value: 'other', label: 'Lainnya' }
	];

	type BrilinkTransaction = {
		id: string;
		createdAt: string | Date | null;
		referenceNumber: string;
		trxType: string;
		customerAmount: number | string;
		adminFeeCharged: number | string;
		agentCommission: number | string;
		cashier?: { name: string } | null;
		status: string;
	};

	// Column Definition Setup
	const columns: ColumnDef<BrilinkTransaction>[] = [
		{
			accessorKey: 'createdAt',
			header: 'Waktu',
			cell: ({ row }) => renderSnippet(timeSnippet, row.original)
		},
		{
			accessorKey: 'referenceNumber',
			header: 'No. Ref',
			cell: ({ row }) => renderSnippet(refSnippet, row.original)
		},
		{
			accessorKey: 'trxType',
			header: 'Jenis',
			cell: ({ row }) => renderSnippet(typeSnippet, row.original)
		},
		{
			accessorKey: 'customerAmount',
			header: 'Nominal',
			cell: ({ row }) => renderSnippet(amountSnippet, row.original)
		},
		{
			accessorKey: 'adminFeeCharged',
			header: 'Admin',
			cell: ({ row }) => renderSnippet(adminFeeSnippet, row.original)
		},
		{
			accessorKey: 'agentCommission',
			header: 'Komisi',
			cell: ({ row }) => renderSnippet(commissionSnippet, row.original)
		},
		{
			accessorKey: 'cashier.name',
			header: 'Kasir',
			cell: ({ row }) => renderSnippet(cashierSnippet, row.original)
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

	function initTable(transactions: BrilinkTransaction[]) {
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
{#snippet timeSnippet(trx: BrilinkTransaction)}
	<span class="font-mono text-xs">{formatDateTime(trx.createdAt)}</span>
{/snippet}

{#snippet refSnippet(trx: BrilinkTransaction)}
	<span class="font-mono text-xs font-semibold text-foreground">{trx.referenceNumber}</span>
{/snippet}

{#snippet typeSnippet(trx: BrilinkTransaction)}
	{@const typeInfo = typeLabels[trx.trxType] || {
		label: trx.trxType,
		color: 'border-muted bg-muted/50 text-muted-foreground'
	}}
	<Badge
		class="rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase shadow-none {typeInfo.color}"
	>
		{typeInfo.label}
	</Badge>
{/snippet}

{#snippet amountSnippet(trx: BrilinkTransaction)}
	<span class="font-mono text-sm text-foreground">{formatRupiah(Number(trx.customerAmount))}</span>
{/snippet}

{#snippet adminFeeSnippet(trx: BrilinkTransaction)}
	<span class="font-mono text-sm text-secondary-foreground"
		>{formatRupiah(Number(trx.adminFeeCharged))}</span
	>
{/snippet}

{#snippet commissionSnippet(trx: BrilinkTransaction)}
	<span class="font-mono text-sm font-semibold text-primary"
		>{formatRupiah(Number(trx.agentCommission))}</span
	>
{/snippet}

{#snippet cashierSnippet(trx: BrilinkTransaction)}
	<span class="font-mono text-sm text-secondary-foreground">{trx.cashier?.name ?? 'Sistem'}</span>
{/snippet}

{#snippet statusSnippet(trx: BrilinkTransaction)}
	{#if trx.status === 'success'}
		<Badge
			variant="outline"
			class="border-transparent bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary shadow-none"
		>
			<span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
			BERHASIL
		</Badge>
	{:else}
		<Badge
			variant="outline"
			class="border-transparent bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-destructive shadow-none"
		>
			<span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-destructive"></span>
			VOID
		</Badge>
	{/if}
{/snippet}

{#snippet actionsSnippet(trx: BrilinkTransaction)}
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
								targetRef = trx.referenceNumber;
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
						>Void Transaksi</span
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
	<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
		<div>
			<h3 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Manajemen Brilink
			</h3>
			<p class="text-sm text-secondary-foreground">
				Ikhtisar dan riwayat transaksi layanan BRI Link
			</p>
		</div>
	</div>

	<!-- Stats Grid (Bento Grid) -->
	{#await data.streamed.summary}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			{#each Array.from({ length: 3 }, (_, i) => i) as i (i)}
				<Card.Root class="border-border bg-card">
					<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
						<Skeleton class="h-3 w-24" />
						<Skeleton class="h-5 w-5 rounded-full" />
					</Card.Header>
					<Card.Content>
						<Skeleton class="mt-1 h-7 w-32" />
						<Skeleton class="mt-2 h-3 w-40" />
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{:then summary}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<!-- Commission Card -->
			<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
						>Komisi Transaksi</span
					>
					<Coins class="size-5 text-primary" />
				</Card.Header>
				<Card.Content>
					<div class="font-tight text-2xl font-semibold text-foreground">
						{formatRupiah(summary?.grandTotalCommission ?? 0)}
					</div>
					<span class="mt-1 block font-mono text-[11px] text-muted-foreground"
						>Sesuai rentang tanggal</span
					>
				</Card.Content>
			</Card.Root>

			<!-- Volume Card -->
			<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
						>Volume Transaksi</span
					>
					<Wallet class="size-5 text-primary" />
				</Card.Header>
				<Card.Content>
					<div class="font-tight text-2xl font-semibold text-foreground">
						{formatRupiah(summary?.grandTotalVolume ?? 0)}
					</div>
					<span class="mt-1 block font-mono text-[11px] text-muted-foreground"
						>Nilai kotor (Sesuai rentang tanggal)</span
					>
				</Card.Content>
			</Card.Root>

			<!-- Transaction Count Card -->
			<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
						>Total Transaksi</span
					>
					<ArrowRightLeft class="size-5 text-primary" />
				</Card.Header>
				<Card.Content>
					<div class="font-tight text-2xl font-semibold text-foreground">
						{summary?.breakdown?.reduce((acc, curr) => acc + curr.totalTransaction, 0) ?? 0}
					</div>
					<span class="mt-1 block font-mono text-[11px] text-muted-foreground"
						>Transaksi berhasil (Sesuai rentang tanggal)</span
					>
				</Card.Content>
			</Card.Root>
		</div>
	{/await}

	<!-- Filter Row -->
	<div
		class="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm md:flex-row md:items-end md:justify-between"
	>
		<!-- Filter Group -->
		<div class="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
			<!-- Date Filter -->
			<div class="w-full shrink-0 md:w-64">
				<span class="font-mono text-xs text-secondary-foreground">Pilih Tanggal</span>
				<div class="relative mt-1.5">
					<Popover.Root bind:open={openDate}>
						<Popover.Trigger class="w-full">
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									class={cn(
										'w-full justify-start text-left font-mono font-normal',
										!selectedDateValue && 'text-muted-foreground',
										props.class as string
									)}
								>
									<Calendar class="mr-2 h-4 w-4" />
									<span class="font-mono">
										{selectedDateValue
											? df.format(selectedDateValue.toDate(getLocalTimeZone()))
											: 'Pilih Tanggal'}
									</span>
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-auto p-0" align="start">
							<CalendarUI
								type="single"
								value={selectedDateValue as DateValue | undefined}
								onValueChange={(val: unknown) => {
									const parsedVal = val as DateValue | undefined;
									selectedDateValue = parsedVal;
									selectedDateStr = parsedVal ? parsedVal.toString() : '';
									handleFilterChange({ date: selectedDateStr });
									openDate = false;
								}}
							/>
						</Popover.Content>
					</Popover.Root>
				</div>
			</div>

			<!-- Type Filter -->
			<div class="w-full shrink-0 md:w-64">
				<span class="font-mono text-xs text-secondary-foreground">Jenis Transaksi</span>
				<div class="relative mt-1.5">
					<Popover.Root bind:open={openType}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									role="combobox"
									aria-expanded={openType}
									class={cn(
										'flex w-full min-w-0 items-center justify-between font-mono text-sm font-normal',
										props.class as string
									)}
								>
									<span class="flex-1 truncate text-left font-mono">
										{typesList.find((t) => t.value === selectedType)?.label ?? 'Semua Jenis'}
									</span>
									<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-(--bits-popover-anchor-width) p-0">
							<Command.Root
								class="`**:data-[slot=command-input]:focus:ring-0 `**:data-[slot=command-input]:focus-visible:ring-0 focus:outline-none focus-visible:outline-none **:data-[slot=command-input-wrapper]:focus-within:ring-0"
							>
								<Command.Input
									class="h-9 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
									placeholder="Cari jenis transaksi..."
								/>
								<Command.List>
									<Command.Empty>Jenis tidak ditemukan.</Command.Empty>
									<Command.Group>
										<Command.Item
											value=""
											onSelect={() => {
												selectedType = '';
												handleFilterChange({ type: '' });
												openType = false;
											}}
										>
											<Check
												class="mr-2 h-4 w-4 {selectedType === '' ? 'opacity-100' : 'opacity-0'}"
											/>
											Semua Jenis
										</Command.Item>
										{#each typesList as type (type.value)}
											<Command.Item
												value={type.value}
												onSelect={() => {
													selectedType = type.value;
													handleFilterChange({ type: type.value });
													openType = false;
												}}
											>
												<Check
													class="mr-2 h-4 w-4 {selectedType === type.value
														? 'opacity-100'
														: 'opacity-0'}"
												/>
												{type.label}
											</Command.Item>
										{/each}
									</Command.Group>
								</Command.List>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
				</div>
			</div>
		</div>

		<!-- Action Group -->
		<div class="flex shrink-0 items-end">
			<Button
				variant="outline"
				onclick={resetFilters}
				class="w-full gap-2 border-border text-secondary-foreground md:w-auto"
			>
				<RefreshCw class="size-4" />
				<span class="font-mono text-xs">Reset Filter</span>
			</Button>
		</div>
	</div>

	<!-- Data Table Container -->
	<div class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
		<Table.Root>
			<Table.Header>
				<Table.Row class="border-b border-border bg-background hover:bg-background">
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Waktu</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>No. Ref</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Jenis</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Nominal</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Admin</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Komisi</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Kasir</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Status</Table.Head
					>
					<Table.Head class="text-right font-mono text-xs text-secondary-foreground uppercase"
						>Aksi</Table.Head
					>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#await data.streamed.transactions}
					{#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
						<Table.Row>
							<Table.Cell><Skeleton class="h-4 w-16" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
							<Table.Cell><Skeleton class="h-5 w-16 rounded-full" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-16" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-16" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-16" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-16" /></Table.Cell>
							<Table.Cell><Skeleton class="ml-auto h-8 w-16 rounded-md" /></Table.Cell>
						</Table.Row>
					{/each}
				{:then result}
					{@const resolvedTransactions = result?.data || []}
					{#if resolvedTransactions.length > 0}
						{@const table = initTable(resolvedTransactions)}
						{#each table.getRowModel().rows as row, rowIdx (row.id)}
							<Table.Row
								class="group animate-in transition-colors fade-in slide-in-from-bottom-1 hover:bg-muted/50 {row
									.original.status !== 'success'
									? 'opacity-50'
									: ''}"
								style="animation-delay: {rowIdx * 40}ms; animation-fill-mode: both;"
							>
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell class={cell.column.id === 'actions' ? 'text-right' : ''}>
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/each}
							</Table.Row>
						{/each}
					{:else}
						<Table.Row>
							<Table.Cell colspan={9} class="h-24 text-center">
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
	</div>

	<!-- Pagination Info -->
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

<DeleteConfirmDialog bind:open={showVoid} itemName={targetRef} onConfirm={handleVoid} />
<BrilinkDetailDialog bind:open={showDetail} transactionId={detailTargetId} />
