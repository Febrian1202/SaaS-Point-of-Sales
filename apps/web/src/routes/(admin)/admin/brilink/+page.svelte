<script lang="ts">
	import { Coins, Wallet, ArrowRightLeft, Calendar, RefreshCw } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { formatRupiah } from '$lib/utils/index';
	import { getVisiblePages } from '$lib/utils/shared';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import DeleteConfirmDialog from '$lib/features/shared/DeleteConfirmDialog.svelte';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';

	// Props data
	let { data } = $props();

	// State filter
	let selectedDate = $state(page.url.searchParams.get('date') ?? '');
	let selectedType = $state(page.url.searchParams.get('type') ?? '');

	// State Dialog Void
	let showVoid = $state(false);
	let targetId = $state('');
	let targetRef = $state('');

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
			selectedDate = page.url.searchParams.get('date') ?? '';
			selectedType = page.url.searchParams.get('type') ?? '';
		}
	});

	// Handler filter change
	function handleFilterChange(patch: { date?: string; type?: string } = {}) {
		const urlParams = new SvelteURLSearchParams(page.url.searchParams);

		const dt = 'date' in patch ? patch.date : selectedDate;
		const tp = 'type' in patch ? patch.type : selectedType;

		if (dt) urlParams.set('date', dt);
		else urlParams.delete('date');

		if (tp) urlParams.set('type', tp);
		else urlParams.delete('type');

		urlParams.delete('page');

		goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
	}

	function resetFilters() {
		selectedDate = '';
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

	// Mapping tipe transaksi
	const typeLabels: Record<string, { label: string; color: string }> = {
		transfer: { label: 'Transfer', color: 'border-blue-400/20 bg-blue-900/20 text-blue-400' },
		tarik_tunai: {
			label: 'Tarik Tunai',
			color: 'border-purple-400/20 bg-purple-900/20 text-purple-400'
		},
		pembayaran: {
			label: 'Pembayaran',
			color: 'border-amber-400/20 bg-amber-900/20 text-amber-400'
		},
		'e-wallet': { label: 'E-Wallet', color: 'border-cyan-400/20 bg-cyan-900/20 text-cyan-400' },
		other: { label: 'Lainnya', color: 'border-gray-400/20 bg-gray-900/20 text-gray-400' }
	};

	const typesList = [
		{ value: 'transfer', label: 'Transfer' },
		{ value: 'tarik_tunai', label: 'Tarik Tunai' },
		{ value: 'pembayaran', label: 'Pembayaran' },
		{ value: 'e-wallet', label: 'E-Wallet' },
		{ value: 'other', label: 'Lainnya' }
	];
</script>

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
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			{#each Array.from({ length: 3 }, (_, i) => i) as i (i)}
				<Card.Root class="relative overflow-hidden border-border bg-card p-6">
					<Skeleton class="h-4 w-28" />
					<Skeleton class="mt-4 h-8 w-40" />
					<Skeleton class="mt-4 h-4 w-20" />
				</Card.Root>
			{/each}
		</div>
	{:then summary}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<!-- Commission Card -->
			<Card.Root class="group relative overflow-hidden border-border bg-card p-6">
				<div class="absolute top-0 right-0 p-4 opacity-10">
					<Coins class="size-16 text-foreground" />
				</div>
				<p class="mb-2 font-mono text-xs tracking-wider text-secondary-foreground uppercase">
					Total Komisi Terpilih
				</p>
				<h3 class="font-tight text-3xl font-semibold text-primary">
					{formatRupiah(summary?.grandTotalCommission ?? 0)}
				</h3>
				<div class="mt-4 flex items-center gap-2">
					<span class="flex items-center font-mono text-xs text-secondary-foreground">
						Berdasarkan filter tanggal
					</span>
				</div>
			</Card.Root>

			<!-- Volume Card -->
			<Card.Root class="group relative overflow-hidden border-border bg-card p-6">
				<div class="absolute top-0 right-0 p-4 opacity-10">
					<Wallet class="size-16 text-foreground" />
				</div>
				<p class="mb-2 font-mono text-xs tracking-wider text-secondary-foreground uppercase">
					Total Volume Transaksi
				</p>
				<h3 class="font-tight text-3xl font-semibold text-foreground">
					{formatRupiah(summary?.grandTotalVolume ?? 0)}
				</h3>
				<div class="mt-4 flex items-center gap-2">
					<span class="flex items-center font-mono text-xs text-secondary-foreground">
						Uang beredar (bruto)
					</span>
				</div>
			</Card.Root>

			<!-- Transaction Count Card -->
			<Card.Root class="group relative overflow-hidden border-border bg-card p-6">
				<div class="absolute top-0 right-0 p-4 opacity-10">
					<ArrowRightLeft class="size-16 text-foreground" />
				</div>
				<p class="mb-2 font-mono text-xs tracking-wider text-secondary-foreground uppercase">
					Jumlah Transaksi
				</p>
				<h3 class="font-tight text-3xl font-semibold text-foreground">
					{summary?.breakdown?.reduce((acc, curr) => acc + curr.totalTransaction, 0) ?? 0}
				</h3>
				<div class="mt-4 flex items-center gap-2">
					<span class="flex items-center font-mono text-xs text-secondary-foreground">
						Transaksi berhasil
					</span>
				</div>
			</Card.Root>
		</div>
	{/await}

	<!-- Filter Row -->
	<div
		class="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm"
	>
		<!-- Date Filter -->
		<div class="min-w-50 flex-1 space-y-1.5">
			<span class="font-mono text-xs text-secondary-foreground">Pilih Tanggal</span>
			<div class="relative">
				<Calendar class="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
				<input
					type="date"
					value={selectedDate}
					onchange={(e) => handleFilterChange({ date: e.currentTarget.value })}
					class="w-full rounded-md border border-input bg-transparent py-2 pr-3 pl-9 font-mono text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				/>
			</div>
		</div>

		<!-- Type Filter -->
		<div class="min-w-50 flex-1 space-y-1.5">
			<span class="font-mono text-xs text-secondary-foreground">Jenis Transaksi</span>
			<Select.Root
				type="single"
				value={selectedType}
				onValueChange={(val) => {
					selectedType = val;
					handleFilterChange({ type: val });
				}}
			>
				<Select.Trigger class="w-full font-mono text-sm" aria-label="Filter jenis">
					{typesList.find((t) => t.value === selectedType)?.label ?? 'Semua Jenis'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="" label="Semua Jenis" />
					{#each typesList as type (type.value)}
						<Select.Item value={type.value} label={type.label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<Button
			variant="outline"
			onclick={resetFilters}
			class="gap-2 border-border text-secondary-foreground"
		>
			<RefreshCw class="size-4" />
			<span class="font-mono text-xs">Reset Filter</span>
		</Button>
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
					{@const transactions = result?.data}
					{#if transactions && transactions.length > 0}
						{#each transactions as trx, rowIdx (trx.id)}
							{@const typeInfo = typeLabels[trx.trxType] || {
								label: trx.trxType,
								color: 'border-muted bg-muted/50 text-muted-foreground'
							}}
							<Table.Row
								class="group animate-in transition-colors fade-in slide-in-from-bottom-1 hover:bg-muted/50 {trx.status !==
								'success'
									? 'opacity-50'
									: ''}"
								style="animation-delay: {rowIdx * 40}ms; animation-fill-mode: both;"
							>
								<Table.Cell class="font-mono text-xs">
									{formatDateTime(trx.createdAt)}
								</Table.Cell>
								<Table.Cell class="font-mono text-xs font-semibold text-foreground">
									{trx.referenceNumber}
								</Table.Cell>
								<Table.Cell>
									<Badge
										class="rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase shadow-none {typeInfo.color}"
									>
										{typeInfo.label}
									</Badge>
								</Table.Cell>
								<Table.Cell class="font-mono text-sm text-foreground">
									{formatRupiah(Number(trx.customerAmount))}
								</Table.Cell>
								<Table.Cell class="font-mono text-sm text-secondary-foreground">
									{formatRupiah(Number(trx.adminFeeCharged))}
								</Table.Cell>
								<Table.Cell class="font-mono text-sm font-semibold text-primary">
									{formatRupiah(Number(trx.agentCommission))}
								</Table.Cell>
								<Table.Cell class="font-mono text-sm text-secondary-foreground">
									{trx.cashier?.name ?? 'Sistem'}
								</Table.Cell>
								<Table.Cell>
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
								</Table.Cell>
								<Table.Cell class="text-right">
									{#if trx.status === 'success'}
										<Button
											variant="outline"
											size="sm"
											class="h-7 border-destructive/20 font-mono text-[10px] tracking-wider text-destructive uppercase hover:bg-destructive hover:text-destructive-foreground"
											onclick={() => {
												targetId = trx.id;
												targetRef = trx.referenceNumber;
												showVoid = true;
											}}
										>
											Void
										</Button>
									{/if}
								</Table.Cell>
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

<DeleteConfirmDialog bind:open={showVoid} itemName={targetRef} onConfirm={handleVoid} />
