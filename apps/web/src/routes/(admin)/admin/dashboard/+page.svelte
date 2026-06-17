<script lang="ts">
	import { Sparkles, TriangleAlert } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { SvelteDate } from 'svelte/reactivity';
	import { getProductDisplay, formatRupiah } from '$lib/utils/index';
	import DashboardStats from '$lib/features/admin/dashboard/DashboardStats.svelte';

	let { data }: { data: PageData } = $props();

	const user = $derived(data?.user);

	let activeView = $state<'daily' | 'weekly'>('daily');

	const chartBars = $derived.by(() => {
		const rawRange = data.metrics.range;
		if (!rawRange || rawRange.length === 0) return [];

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
				const formattedDate = new SvelteDate(day.date).toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'short'
				});

				return {
					dayName,
					dateLabel: formattedDate,
					height: `${Math.max(5, height)}%`,
					revenue: day.retailRevenue,
					brilinkCommission: day.brilinkCommission || 0,
					grossProfit: day.grossProfit || 0,
					trxCount: day.trxCount || 0,
					itemsSold: day.itemsSold || 0,
					isToday: day.date === new Date().toISOString().substring(0, 10)
				};
			});
		} else {
			// Get all data from the raw range into a map for fast lookup
			const dataMap = new Map(rawRange.map((r) => [r.date, r]));

			const weeks: Array<{
				name: string;
				revenue: number;
				brilinkCommission: number;
				grossProfit: number;
				trxCount: number;
				itemsSold: number;
				isCurrent: boolean;
				dateRange: string;
			}> = [];

			// Create 4 exactly 7-day chunks going backwards from today
			const today = new Date();

			for (let i = 0; i < 4; i++) {
				const chunkData = [];
				let endDate = new SvelteDate(today);
				endDate.setDate(today.getDate() - i * 7);

				let startDate = new SvelteDate(endDate);
				startDate.setDate(endDate.getDate() - 6);

				// Collect the 7 days for this chunk
				for (let d = new SvelteDate(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
					const dateStr = d.toISOString().substring(0, 10);
					const dayData = dataMap.get(dateStr);
					if (dayData) {
						chunkData.push(dayData);
					}
				}

				const totalRevenue = chunkData.reduce((sum, d) => sum + d.retailRevenue, 0);
				const totalBrilink = chunkData.reduce((sum, d) => sum + (d.brilinkCommission || 0), 0);
				const totalGrossProfit = chunkData.reduce((sum, d) => sum + (d.grossProfit || 0), 0);
				const totalTrxCount = chunkData.reduce((sum, d) => sum + (d.trxCount || 0), 0);
				const totalItemsSold = chunkData.reduce((sum, d) => sum + (d.itemsSold || 0), 0);

				const startLabel = startDate.toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'short'
				});
				const endLabel = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

				// We unshift to make the oldest week first (left side of chart)
				weeks.unshift({
					name: `MINGGU ${4 - i}`,
					revenue: totalRevenue,
					brilinkCommission: totalBrilink,
					grossProfit: totalGrossProfit,
					trxCount: totalTrxCount,
					itemsSold: totalItemsSold,
					isCurrent: i === 0,
					dateRange: `${startLabel} - ${endLabel}`
				});
			}

			const maxRevenue = Math.max(...weeks.map((w) => w.revenue), 1);
			return weeks.map((w) => {
				const height = maxRevenue > 1 ? (w.revenue / maxRevenue) * 95 : 5;
				return {
					dayName: w.name,
					dateLabel: w.dateRange,
					height: `${Math.max(5, height)}%`,
					revenue: w.revenue,
					brilinkCommission: w.brilinkCommission || 0,
					grossProfit: w.grossProfit || 0,
					trxCount: w.trxCount || 0,
					itemsSold: w.itemsSold || 0,
					isToday: w.isCurrent
				};
			});
		}
	});
</script>

<!-- TODO: refactor kalau ada kesempatan -->
<!-- Bagi section jadi component component-->
<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-3">
	<!-- Header Section with Single Accent CTA -->
	{@render header(user?.name || 'Admin')}

	<!-- Stats Grid (Graphite Card Surfaces) -->
	<DashboardStats daily={data.metrics.daily} />

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

		{#if chartBars.length === 0}
			<div
				class="flex h-64 flex-col items-center justify-center rounded-lg border border-border bg-background/50 p-6 text-center"
			>
				<p class="text-sm font-semibold text-foreground">Belum ada data pendapatan</p>
				<p class="mt-1 text-xs text-muted-foreground">Silakan tunggu hingga ada transaksi masuk</p>
			</div>
		{:else}
			{#key activeView}
				<div class="relative h-64 w-full animate-in overflow-hidden duration-300 fade-in">
					<!-- Chart Bars -->
					<div
						class="absolute bottom-0 left-0 flex h-full w-full items-end justify-between gap-2 px-2"
					>
						{#each chartBars as bar (bar.dayName)}
							<HoverCard.Root openDelay={0} closeDelay={100}>
								<HoverCard.Trigger>
									{#snippet child({ props })}
										<div
											{...props}
											class="group relative w-full cursor-pointer rounded-lg border transition-colors duration-300 hover:border-muted-foreground/50 {bar.isToday
												? 'border-primary/50 bg-primary/10'
												: 'border-border/50 bg-border/30'}"
											style="height: {bar.height};"
										>
											<div
												class="absolute inset-0 rounded-lg bg-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
											></div>
										</div>
									{/snippet}
								</HoverCard.Trigger>
								<HoverCard.Content
									class="z-50 w-64 rounded-xl border border-border bg-[#17191C] p-4 text-[#ECEDEE] shadow-xl"
									side="top"
									align="center"
									sideOffset={10}
								>
									<div class="mb-3 border-b border-border/50 pb-2">
										<h4 class="font-mono text-xs font-bold text-[#ECEDEE]">{bar.dayName}</h4>
										<p class="font-mono text-[10px] text-muted-foreground">{bar.dateLabel}</p>
									</div>
									<div class="grid grid-cols-2 gap-x-2 gap-y-3">
										<!-- Metrik 1: Retail -->
										<div class="space-y-0.5">
											<span class="block font-mono text-[9px] text-muted-foreground uppercase"
												>Omzet Retail</span
											>
											<span class="block font-tight text-sm font-semibold"
												>{formatRupiah(bar.revenue)}</span
											>
										</div>
										<!-- Metrik 2: Laba -->
										<div class="space-y-0.5">
											<span class="block font-mono text-[9px] text-muted-foreground uppercase"
												>Laba Kotor</span
											>
											<span class="block font-tight text-sm font-semibold text-[#B4FF39]"
												>{formatRupiah(bar.grossProfit)}</span
											>
										</div>
										<!-- Metrik 3: Brilink -->
										<div class="space-y-0.5">
											<span class="block font-mono text-[9px] text-muted-foreground uppercase"
												>Brilink</span
											>
											<span class="block font-tight text-sm font-semibold"
												>{formatRupiah(bar.brilinkCommission)}</span
											>
										</div>
										<!-- Metrik 4: Transaksi & Items -->
										<div class="space-y-0.5">
											<span class="block font-mono text-[9px] text-muted-foreground uppercase"
												>Transaksi / Item</span
											>
											<span class="block font-tight text-sm font-semibold"
												>{bar.trxCount}
												<span class="text-xs font-normal text-muted-foreground"
													>/ {bar.itemsSold}</span
												></span
											>
										</div>
									</div>
								</HoverCard.Content>
							</HoverCard.Root>
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
		{/if}
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
					<a href="/admin/transactions"> Lihat Semua </a>
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
						{#if data.metrics.transactions.length === 0}
							<Table.Row>
								<Table.Cell colspan={4} class="py-8 text-center text-sm text-muted-foreground">
									Belum ada transaksi hari ini.
								</Table.Cell>
							</Table.Row>
						{:else}
							{#each data.metrics.transactions as trx (trx.id)}
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
											<span class="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
											{trx.status.toUpperCase()}
										</Badge>
									</Table.Cell>
								</Table.Row>
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<!-- Stock Warnings (Graphite Surfaces) -->
		<Card.Root class="flex flex-col gap-0 overflow-hidden border-border bg-card pt-0">
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
			<Card.Content class="flex flex-1 flex-col p-4">
				{#if data.metrics.lowStock.length === 0}
					<div
						class="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground"
					>
						Semua produk memiliki stok yang aman.
					</div>
				{:else}
					<div class="space-y-4">
						{#each data.metrics.lowStock as product (product.id)}
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
					</div>
				{/if}
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
