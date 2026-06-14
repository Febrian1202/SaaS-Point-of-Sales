<script lang="ts">
	import { Sparkles, TriangleAlert } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { SvelteDate } from 'svelte/reactivity';
	import { getProductDisplay, formatRupiah } from '$lib/utils/index';
	import DashboardStats from '$lib/features/admin/dashboard/DashboardStats.svelte';

	let { data }: { data: PageData } = $props();

	const user = $derived(data?.user);

	let activeView = $state<'daily' | 'weekly'>('daily');

	// Helper to resolve range data if it is a promise or array
	let resolvedRange = $state<
		Array<{ date: string; retailRevenue: number; brilinkCommission: number; trxCount: number }>
	>([]);

	$effect(() => {
		if (data.streamed.range instanceof Promise) {
			data.streamed.range.then((val) => {
				resolvedRange = val;
			});
		} else if (Array.isArray(data.streamed.range)) {
			resolvedRange = data.streamed.range;
		}
	});

	const chartBars = $derived.by(() => {
		const rawRange = resolvedRange;
		if (rawRange.length === 0) return [];

		if (activeView === 'daily') {
			const sorted = [...rawRange].sort((a, b) => a.date.localeCompare(b.date));
			const dailyData = sorted.slice(-7);
			const maxRevenue = Math.max(...dailyData.map((r) => r.retailRevenue), 1);
			return dailyData.map((day) => {
				const height = maxRevenue > 1 ? (day.retailRevenue / maxRevenue) * 95 : 5;

				const dayNamesMap: Record<string, string> = {
					SUN: 'MINGGU',
					MON: 'SENIN',
					TUE: 'SELASA',
					WED: 'RABU',
					THU: 'KAMIS',
					FRI: 'JUMAT',
					SAT: 'SABTU'
				};
				const englishDay = new SvelteDate(day.date)
					.toLocaleDateString('en-US', { weekday: 'short' })
					.toUpperCase();
				const dayName = dayNamesMap[englishDay] || englishDay;

				return {
					dayName,
					height: `${Math.max(5, height)}%`,
					revenue: day.retailRevenue,
					isToday: day.date === new Date().toISOString().substring(0, 10),
					tooltip: `${dayName}: ${formatRupiah(day.retailRevenue)}`
				};
			});
		} else {
			const sortedData = [...rawRange].sort((a, b) => a.date.localeCompare(b.date));
			const weeks: Array<{ name: string; revenue: number; isCurrent: boolean; dateRange: string }> =
				[];

			for (let i = 0; i < 4; i++) {
				const startIdx = i * 7;
				const endIdx = startIdx + 7;
				const weekDays = sortedData.slice(startIdx, endIdx);

				if (weekDays.length > 0) {
					const totalRevenue = weekDays.reduce((sum, d) => sum + d.retailRevenue, 0);
					const isCurrent = i === 3;

					const startDate = new SvelteDate(weekDays[0].date);
					const endDate = new SvelteDate(weekDays[weekDays.length - 1].date);

					const startLabel = startDate.toLocaleDateString('id-ID', {
						day: 'numeric',
						month: 'short'
					});
					const endLabel = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

					weeks.push({
						name: `MINGGU ${i + 1}`,
						revenue: totalRevenue,
						isCurrent,
						dateRange: `${startLabel} - ${endLabel}`
					});
				}
			}

			const maxRevenue = Math.max(...weeks.map((w) => w.revenue), 1);
			return weeks.map((w) => {
				const height = maxRevenue > 1 ? (w.revenue / maxRevenue) * 95 : 5;
				return {
					dayName: w.name,
					height: `${Math.max(5, height)}%`,
					revenue: w.revenue,
					isToday: w.isCurrent,
					tooltip: `${w.name} (${w.dateRange}): ${formatRupiah(w.revenue)}`
				};
			});
		}
	});
</script>

<!-- TODO: refactor kalau ada kesempatan -->
<!-- Bagi section jadi component component-->
<svelte:head>
	<title>Dashboard Admin | Kios Sheza</title>
</svelte:head>

<div class="animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-3">
	<!-- Header Section with Single Accent CTA -->
	{@render header(user?.name || 'Admin')}

	<!-- Stats Grid (Graphite Card Surfaces) -->
	<DashboardStats promiseDaily={data.streamed.daily} />

	<!-- Revenue Chart Area -->
	<Card.Root class="border-border bg-card p-6">
		<div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
			<div>
				<h4 class="font-tight text-lg font-semibold text-foreground">Tren Pendapatan</h4>
				<p class="text-sm text-muted-foreground">
					{activeView === 'daily'
						? 'Visualisasi performa dalam 7 hari terakhir'
						: 'Visualisasi performa dalam 4 minggu terakhir'}
				</p>
			</div>
			<div class="flex rounded-lg border border-border bg-background p-1">
				<Button
					variant={activeView === 'daily' ? 'secondary' : 'ghost'}
					size="sm"
					class="h-7 rounded-md px-3 font-mono text-[10px] tracking-wider uppercase {activeView ===
					'daily'
						? 'bg-border text-foreground hover:bg-border/80'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeView = 'daily')}
				>
					Harian
				</Button>
				<Button
					variant={activeView === 'weekly' ? 'secondary' : 'ghost'}
					size="sm"
					class="h-7 rounded-md px-3 font-mono text-[10px] tracking-wider uppercase {activeView ===
					'weekly'
						? 'bg-border text-foreground hover:bg-border/80'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeView = 'weekly')}
				>
					Mingguan
				</Button>
			</div>
		</div>

		{#await data.streamed.range}
			<div class="flex h-64 w-full items-end justify-between gap-2 px-2">
				{#each Array(activeView === 'daily' ? 7 : 4) as _, i (i)}
					<div class="h-32 w-full animate-pulse rounded bg-border/40" data-val={_}></div>
				{/each}
			</div>
			<div class="mt-4 flex justify-between px-2">
				{#each Array(activeView === 'daily' ? 7 : 4) as _, i (i)}
					<div class="h-4 w-8 animate-pulse rounded bg-border/40" data-val={_}></div>
				{/each}
			</div>
		{:then}
			{#key activeView}
				<div class="relative h-64 w-full animate-in overflow-hidden duration-300 fade-in">
					<!-- Chart Bars -->
					<div
						class="absolute bottom-0 left-0 flex h-full w-full items-end justify-between gap-2 px-2"
					>
						{#each chartBars as bar (bar.dayName)}
							<div
								class="w-full rounded-t-sm transition-all duration-500 {bar.isToday
									? 'border-t-4 border-primary bg-primary/30'
									: 'border-t-2 border-primary bg-primary/20'}"
								style="height: {bar.height};"
								title={bar.tooltip}
							></div>
						{/each}
					</div>
					<!-- Grid Lines -->
					<div class="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-5">
						<div class="w-full border-b border-foreground"></div>
						<div class="w-full border-b border-foreground"></div>
						<div class="w-full border-b border-foreground"></div>
						<div class="w-full border-b border-foreground"></div>
						<div class="w-full border-b border-foreground"></div>
					</div>
				</div>

				<!-- Days Labels -->
				<div class="mt-4 flex animate-in justify-between px-2 duration-300 fade-in">
					{#each chartBars as bar (bar.dayName)}
						<span
							class="font-mono text-[10px] {bar.isToday
								? 'font-bold text-primary'
								: 'text-muted-foreground'}"
						>
							{bar.dayName}{bar.isToday ? ' (HARI INI)' : ''}
						</span>
					{/each}
				</div>
			{/key}
		{:catch error}
			<div
				class="flex h-64 flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center"
			>
				<p class="text-sm font-semibold text-destructive">Gagal memuat tren pendapatan</p>
				<p class="mt-1 text-xs text-muted-foreground">{error?.message || 'Terjadi kesalahan'}</p>
			</div>
		{/await}
	</Card.Root>

	<!-- Data Columns (Table and Warnings) -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Recent Transactions (Using Shadcn Table) -->
		<Card.Root class="gap-0 overflow-hidden border-border bg-card pt-0 pb-0">
			<Card.Header
				class="flex flex-row items-center justify-between border-b border-border bg-background/30 p-4 [.border-b]:pb-4"
			>
				<Card.Title class="font-tight text-lg text-foreground">Transaksi Terbaru</Card.Title>
				<Button
					variant="link"
					class="h-auto p-0 font-mono text-xs tracking-wider text-primary uppercase hover:underline"
				>
					Lihat Semua
				</Button>
			</Card.Header>
			<Card.Content class="p-0">
				<Table.Root>
					<Table.Header class="border-b border-border bg-background/20">
						<Table.Row class="border-b border-border hover:bg-transparent">
							<Table.Head
								class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
								>ID INV</Table.Head
							>
							<Table.Head
								class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
								>PRODUK</Table.Head
							>
							<Table.Head
								class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
								>TOTAL</Table.Head
							>
							<Table.Head
								class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
								>STATUS</Table.Head
							>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#await data.streamed.transactions}
							{#each Array(3) as _, i (i)}
								<Table.Row class="border-b border-border/50" data-val={_}>
									<Table.Cell class="px-4 py-3"
										><div class="h-4 w-16 animate-pulse rounded bg-border/40"></div></Table.Cell
									>
									<Table.Cell class="px-4 py-3"
										><div class="h-4 w-32 animate-pulse rounded bg-border/40"></div></Table.Cell
									>
									<Table.Cell class="px-4 py-3"
										><div class="h-4 w-20 animate-pulse rounded bg-border/40"></div></Table.Cell
									>
									<Table.Cell class="px-4 py-3"
										><div class="h-5 w-12 animate-pulse rounded bg-border/40"></div></Table.Cell
									>
								</Table.Row>
							{/each}
						{:then transactions}
							{#if transactions.length === 0}
								<Table.Row>
									<Table.Cell colspan={4} class="py-8 text-center text-sm text-muted-foreground">
										Belum ada transaksi hari ini.
									</Table.Cell>
								</Table.Row>
							{:else}
								{#each transactions as trx (trx.id)}
									<Table.Row class="border-b border-border/50 transition-colors hover:bg-border/10">
										<Table.Cell class="px-4 py-3 font-mono text-xs text-foreground"
											>{trx.trxNumber}</Table.Cell
										>
										<Table.Cell class="px-4 py-3 text-sm text-foreground"
											>{getProductDisplay(trx.items)}</Table.Cell
										>
										<Table.Cell class="px-4 py-3 font-mono text-xs text-foreground"
											>{formatRupiah(trx.totalAmount)}</Table.Cell
										>
										<Table.Cell class="px-4 py-3">
											<Badge
												class="rounded-sm border-transparent bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary select-none"
											>
												<span class="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
												></span>
												{trx.status.toUpperCase()}
											</Badge>
										</Table.Cell>
									</Table.Row>
								{/each}
							{/if}
						{:catch error}
							<Table.Row>
								<Table.Cell colspan={4} class="py-8 text-center text-sm text-destructive">
									Gagal memuat transaksi: {error?.message || 'Terjadi kesalahan'}
								</Table.Cell>
							</Table.Row>
						{/await}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<!-- Stock Warnings (Graphite Surfaces) -->
		<Card.Root class="gap-0 overflow-hidden border-border bg-card pt-0">
			<Card.Header
				class="flex flex-row items-center justify-between border-b border-border bg-background/30 p-4 [.border-b]:pb-4"
			>
				<Card.Title class="font-tight text-lg text-foreground">Stok Menipis</Card.Title>
				<Badge
					variant="destructive"
					class="rounded-sm font-mono text-[9px] font-bold tracking-wider uppercase select-none"
				>
					KRITIS
				</Badge>
			</Card.Header>
			<Card.Content class="space-y-4 p-4">
				{#await data.streamed.lowStock}
					{#each Array(2) as _, i (i)}
						<div
							class="flex animate-pulse items-center justify-between rounded-lg border border-border bg-background p-4"
							data-val={_}
						>
							<div class="flex items-center gap-3">
								<div class="h-12 w-12 rounded border border-border bg-card"></div>
								<div class="space-y-2">
									<div class="h-4 w-32 rounded bg-border/40"></div>
									<div class="h-3 w-20 rounded bg-border/40"></div>
								</div>
							</div>
							<div class="space-y-2 text-right">
								<div class="ml-auto h-4 w-12 rounded bg-border/40"></div>
								<div class="ml-auto h-3 w-10 rounded bg-border/40"></div>
							</div>
						</div>
					{/each}
				{:then lowStock}
					{#if lowStock.length === 0}
						<div class="py-8 text-center text-sm text-muted-foreground">
							Semua produk memiliki stok yang aman.
						</div>
					{:else}
						{#each lowStock as product (product.id)}
							<div
								class="flex items-center justify-between rounded-lg border border-border bg-background p-4"
							>
								<div class="flex items-center gap-3">
									<div
										class="flex h-12 w-12 items-center justify-center rounded border border-border bg-card"
									>
										<Sparkles class="size-5 text-muted-foreground" />
									</div>
									<div>
										<h5 class="text-sm font-semibold text-foreground">{product.name}</h5>
										<p
											class="mt-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
										>
											Kategori: {product.category?.name || 'Umum'}
										</p>
									</div>
								</div>
								<div class="text-right">
									<div class="flex items-center gap-1 text-sm font-bold text-destructive">
										<TriangleAlert class="size-4" />
										<span class="font-mono">{product.stockQty} {product.unit || 'pcs'}</span>
									</div>
									<Button
										variant="link"
										class="mt-1 h-auto p-0 font-mono text-[10px] tracking-wider text-primary uppercase hover:underline"
									>
										Restok
									</Button>
								</div>
							</div>
						{/each}
					{/if}
				{:catch error}
					<div class="py-8 text-center text-sm text-destructive">
						Gagal memuat data stok: {error?.message || 'Terjadi kesalahan'}
					</div>
				{/await}
			</Card.Content>
		</Card.Root>
	</div>
</div>

{#snippet header(userName: string)}
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Selamat Datang, {userName}
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Berikut adalah ringkasan operasional toko Anda hari ini.
			</p>
		</div>
	</div>
{/snippet}
