<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { Calendar as CalendarIcon, Coins, Wallet, Receipt, ShoppingBag, X } from 'lucide-svelte';
	import { useSearchParams } from '$lib/hooks/useSearchParams.svelte.js';
	import * as Card from '$lib/components/ui/card';
	import * as Popover from '$lib/components/ui/popover';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Button } from '$lib/components/ui/button';
	import { formatRupiah } from '$lib/utils/index';
	import { cn } from '$lib/utils';
	import {
		DateFormatter,
		parseDate,
		getLocalTimeZone,
		type DateValue
	} from '@internationalized/date';
	import { SvelteDate } from 'svelte/reactivity';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const searchParams = useSearchParams();

	// Formatter untuk date UI
	const df = new DateFormatter('id-ID', {
		dateStyle: 'medium'
	});

	const dfMonth = new DateFormatter('id-ID', {
		month: 'long',
		year: 'numeric'
	});

	// Sync with URL params reactively
	let selectedDateStr = $derived(searchParams.getParam('date') || data.dateFilter || '');
	let selectedDateValue = $derived(selectedDateStr ? parseDate(selectedDateStr) : undefined);

	let openDate = $state(false);

	let activeView = $state<'daily' | 'monthly'>('daily');

	// Handle Date Change
	function handleDateChange(val: unknown) {
		const parsedVal = val as DateValue | undefined;
		if (parsedVal) {
			const dateString = parsedVal.toString();
			searchParams.updateUrl({ date: dateString });
		} else {
			searchParams.updateUrl({ date: '' });
		}
		openDate = false;
	}

	// Stats Selector
	const currentStats = $derived.by(() => {
		if (activeView === 'daily') {
			return data.metrics.daily;
		} else {
			return data.metrics.monthly;
		}
	});

	// Chart Data Processing
	const chartBars = $derived.by(() => {
		if (activeView === 'daily') {
			const rawRange = data.metrics.range;
			if (!rawRange || rawRange.length === 0) return [];

			const sorted = [...rawRange].sort((a, b) => a.date.localeCompare(b.date));
			const maxRevenue = Math.max(...sorted.map((r) => r.retailRevenue), 1);

			return sorted.map((day) => {
				const height = maxRevenue > 1 ? (day.retailRevenue / maxRevenue) * 100 : 5;
				const dateObj = new SvelteDate(day.date);
				const formattedDate = dateObj.toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'short'
				});
				const dayNumber = dateObj.getDate().toString();

				return {
					dateLabel: formattedDate,
					dayNumber,
					height: `${Math.max(5, height)}%`,
					revenue: day.retailRevenue,
					brilinkCommission: day.brilinkCommission || 0,
					grossProfit: day.grossProfit || 0,
					trxCount: day.trxCount || 0,
					itemsSold: day.itemsSold || 0,
					isTargetDate: day.date === selectedDateStr
				};
			});
		} else {
			const monthlyRange = data.metrics.monthlyRange;
			if (!monthlyRange || monthlyRange.length === 0) return [];

			const maxRevenue = Math.max(...monthlyRange.map((r) => r.retailRevenue), 1);
			const targetMonth = selectedDateStr.substring(0, 7);

			return monthlyRange.map((monthData) => {
				const height = maxRevenue > 1 ? (monthData.retailRevenue / maxRevenue) * 100 : 5;

				// Format month label (e.g. "2026-06" to "Jun 2026")
				const dateObj = new SvelteDate(`${monthData.month}-01T00:00:00`);
				const formattedDate = dateObj.toLocaleDateString('id-ID', {
					month: 'long',
					year: 'numeric'
				});
				const monthShort = dateObj.toLocaleDateString('id-ID', {
					month: 'short'
				});

				return {
					dateLabel: formattedDate,
					dayNumber: monthShort, // Repurpose for X-axis label
					height: `${Math.max(5, height)}%`,
					revenue: monthData.retailRevenue,
					brilinkCommission: monthData.brilinkCommission || 0,
					grossProfit: monthData.grossProfit || 0,
					trxCount: monthData.trxCount || 0,
					itemsSold: 0, // Monthly summary might not have itemsSold easily available
					isTargetDate: monthData.month === targetMonth
				};
			});
		}
	});

	// For Y-Axis labels
	const yAxisLabels = $derived.by(() => {
		const bars = chartBars;
		if (!bars || bars.length === 0) return [];

		const maxRevenue = Math.max(...bars.map((r) => r.revenue), 1);
		// Format to compact notation (e.g. 1.5M, 500K)
		const formatCompact = (num: number) => {
			if (num === 0) return '0';
			return new Intl.NumberFormat('id-ID', {
				notation: 'compact',
				compactDisplay: 'short'
			}).format(num);
		};

		return [
			formatCompact(maxRevenue),
			formatCompact(maxRevenue * 0.75),
			formatCompact(maxRevenue * 0.5),
			formatCompact(maxRevenue * 0.25),
			'0'
		];
	});

	// For X-Axis labels (distribute evenly)
	const chartLabels = $derived.by(() => {
		if (chartBars.length === 0) return [];

		if (activeView === 'monthly') {
			// Show all months on x-axis
			return chartBars.map((b) => ({ label: b.dayNumber }));
		}

		const labels = [];
		const interval = Math.ceil(chartBars.length / 5); // Target ~5-6 labels max

		for (let i = 0; i < chartBars.length; i += interval) {
			labels.push({ label: `Tgl ${chartBars[i].dayNumber}` });
		}
		// Ensure the last day is always included if not already
		if (labels[labels.length - 1]?.label !== `Tgl ${chartBars[chartBars.length - 1].dayNumber}`) {
			labels.push({ label: `Tgl ${chartBars[chartBars.length - 1].dayNumber}` });
		}

		return labels;
	});
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div
	class="flex-1 animate-in space-y-6 overflow-y-auto duration-500 fade-in slide-in-from-bottom-3"
>
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
		<div>
			<h2 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Laporan Performa Toko
			</h2>
			<p class="text-sm text-secondary-foreground">
				Analisis pendapatan dan performa operasional toko.
			</p>
		</div>
	</div>

	<!-- Filter & Stats Section -->
	<Card.Root class="border-border bg-card">
		<Card.Header
			class="flex flex-col gap-4 border-b border-border bg-background/30 pb-6 md:flex-row md:items-center md:justify-between"
		>
			<!-- View Toggle -->
			<div class="flex w-fit rounded-lg border border-border bg-background p-1">
				<Button
					variant={activeView === 'daily' ? 'secondary' : 'ghost'}
					size="sm"
					class="h-8 px-4 font-mono text-xs tracking-wider uppercase {activeView === 'daily'
						? 'bg-border text-foreground hover:bg-border/80'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeView = 'daily')}
				>
					Harian
				</Button>
				<Button
					variant={activeView === 'monthly' ? 'secondary' : 'ghost'}
					size="sm"
					class="h-8 px-4 font-mono text-xs tracking-wider uppercase {activeView === 'monthly'
						? 'bg-border text-foreground hover:bg-border/80'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeView = 'monthly')}
				>
					Bulanan
				</Button>
			</div>

			<!-- Date Filter -->
			<div class="flex w-full flex-col gap-1.5 md:w-auto md:flex-row md:items-center md:gap-3">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Filter Tanggal:</span
				>
				<div class="flex w-full items-center gap-2 md:w-auto">
					<div class="relative w-full md:w-56">
						<Popover.Root bind:open={openDate}>
							<Popover.Trigger>
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
										<CalendarIcon class="mr-2 h-4 w-4" />
										<span class="font-mono">
											{selectedDateValue
												? df.format(selectedDateValue.toDate(getLocalTimeZone()))
												: 'Pilih Tanggal'}
										</span>
									</Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content class="w-auto p-0" align="end">
								<Calendar
									type="single"
									value={selectedDateValue as DateValue | undefined}
									onValueChange={handleDateChange}
								/>
							</Popover.Content>
						</Popover.Root>
					</div>
					{#if searchParams.getParam('date')}
						<div transition:slide={{ axis: 'x', duration: 200 }}>
							<div transition:fade={{ duration: 200 }}>
								<Button
									variant="ghost"
									size="icon"
									class="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									title="Reset Tanggal"
									onclick={() => {
										searchParams.updateUrl({ date: '' });
										openDate = false;
									}}
								>
									<X class="h-4 w-4" />
									<span class="sr-only">Reset Filter</span>
								</Button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</Card.Header>

		<Card.Content class="p-6">
			<!-- Stats Grid -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div
					class="group rounded-lg border border-border bg-background p-4 transition-colors hover:border-muted-foreground/30"
				>
					<div class="mb-4 flex items-center justify-between">
						<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Omzet Retail</span
						>
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-border/50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
						>
							<Coins class="h-4 w-4" />
						</div>
					</div>
					<div class="font-tight text-2xl font-semibold text-foreground">
						{formatRupiah(currentStats?.retailRevenue || 0)}
					</div>
				</div>

				<div
					class="group rounded-lg border border-border bg-background p-4 transition-colors hover:border-muted-foreground/30"
				>
					<div class="mb-4 flex items-center justify-between">
						<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Komisi Brilink</span
						>
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-border/50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
						>
							<Wallet class="h-4 w-4" />
						</div>
					</div>
					<div class="font-tight text-2xl font-semibold text-foreground">
						{formatRupiah(currentStats?.brilinkCommission || 0)}
					</div>
				</div>

				<div
					class="group rounded-lg border border-border bg-background p-4 transition-colors hover:border-muted-foreground/30"
				>
					<div class="mb-4 flex items-center justify-between">
						<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Total Transaksi</span
						>
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-border/50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
						>
							<Receipt class="h-4 w-4" />
						</div>
					</div>
					<div class="font-tight text-2xl font-semibold text-foreground">
						{currentStats?.trxCount || 0}
						<span class="font-mono text-[10px] font-normal text-muted-foreground">Trx</span>
					</div>
				</div>

				<div
					class="group rounded-lg border border-border bg-background p-4 transition-colors hover:border-muted-foreground/30"
				>
					<div class="mb-4 flex items-center justify-between">
						<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Laba Kotor</span
						>
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-border/50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
						>
							<ShoppingBag class="h-4 w-4" />
						</div>
					</div>
					<div class="font-tight text-2xl font-semibold text-foreground">
						{formatRupiah(currentStats?.grossProfit || 0)}
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Monthly Chart Section -->
	<Card.Root class="border-border bg-card">
		<Card.Header
			class="flex flex-row items-center justify-between border-b border-border bg-background/30 p-6"
		>
			<div class="space-y-1">
				<Card.Title class="font-tight text-lg text-foreground"
					>{activeView === 'daily' ? 'Tren Omzet Harian' : 'Tren Omzet Bulanan'}</Card.Title
				>
				<p class="font-mono text-[10px] text-muted-foreground uppercase">
					Kotak hijau menunjukkan hari ini / hari yang dipilih
				</p>
			</div>
			<span class="font-mono text-sm font-semibold text-secondary-foreground">
				{selectedDateValue ? dfMonth.format(selectedDateValue.toDate(getLocalTimeZone())) : ''}
			</span>
		</Card.Header>

		<Card.Content class="p-6">
			{#if chartBars.length === 0}
				<div
					class="flex h-64 flex-col items-center justify-center rounded-lg border border-border bg-background/50 p-6 text-center"
				>
					<p class="text-sm font-semibold text-foreground">
						Belum ada data pendapatan untuk bulan ini.
					</p>
				</div>
			{:else}
				<!-- Grid layout to properly align Y-Axis labels, the plot area, and X-Axis labels -->
				<div
					class="grid h-80 animate-in grid-cols-[auto_1fr] grid-rows-[1fr_auto] gap-x-4 gap-y-2 duration-300 fade-in"
				>
					<!-- Y-Axis Labels -->
					<div class="flex flex-col justify-between py-px text-right">
						{#each yAxisLabels as label, idx (idx)}
							<span class="font-mono text-[10px] text-muted-foreground">{label}</span>
						{/each}
					</div>

					<!-- Main Plot Area -->
					<div class="relative flex-1 border-b border-border/50">
						<!-- Grid Lines (Horizontal) -->
						<div
							class="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-10"
						>
							<div class="w-full border-b border-foreground"></div>
							<div class="w-full border-b border-foreground"></div>
							<div class="w-full border-b border-foreground"></div>
							<div class="w-full border-b border-foreground"></div>
							<div class="w-full border-b border-foreground"></div>
						</div>

						<!-- Chart Bars -->
						<div
							class="absolute bottom-0 left-0 flex h-full w-full items-end justify-between px-1 {activeView ===
							'monthly'
								? 'gap-4 sm:gap-8'
								: 'gap-1'}"
						>
							{#each chartBars as bar (bar.dateLabel)}
								<HoverCard.Root openDelay={0} closeDelay={100}>
									<HoverCard.Trigger>
										{#snippet child({ props })}
											<div
												{...props}
												class="group relative min-w-1.5 flex-1 cursor-pointer rounded-lg border transition-colors duration-300 hover:border-muted-foreground/50 {activeView ===
												'monthly'
													? 'max-w-30'
													: 'max-w-10'} {bar.isTargetDate
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
											<h4 class="font-mono text-xs font-bold text-[#ECEDEE]">{bar.dateLabel}</h4>
										</div>
										<div class="grid grid-cols-2 gap-x-2 gap-y-3">
											<div class="space-y-0.5">
												<span class="block font-mono text-[9px] text-muted-foreground uppercase"
													>Omzet Retail</span
												>
												<span class="block font-tight text-sm font-semibold"
													>{formatRupiah(bar.revenue)}</span
												>
											</div>
											<div class="space-y-0.5">
												<span class="block font-mono text-[9px] text-muted-foreground uppercase"
													>Laba Kotor</span
												>
												<span class="block font-tight text-sm font-semibold text-[#B4FF39]"
													>{formatRupiah(bar.grossProfit)}</span
												>
											</div>
											<div class="space-y-0.5">
												<span class="block font-mono text-[9px] text-muted-foreground uppercase"
													>Brilink</span
												>
												<span class="block font-tight text-sm font-semibold"
													>{formatRupiah(bar.brilinkCommission)}</span
												>
											</div>
											<div class="space-y-0.5">
												<span class="block font-mono text-[9px] text-muted-foreground uppercase"
													>Transaksi {bar.itemsSold > 0 ? '/ Item' : ''}</span
												>
												<span class="block font-tight text-sm font-semibold"
													>{bar.trxCount}
													{#if bar.itemsSold > 0}
														<span class="text-xs font-normal text-muted-foreground"
															>/ {bar.itemsSold}</span
														>
													{/if}
												</span>
											</div>
										</div>
									</HoverCard.Content>
								</HoverCard.Root>
							{/each}
						</div>
					</div>

					<!-- Empty grid cell below Y-Axis to align X-Axis perfectly -->
					<div></div>

					<!-- X-Axis Labels -->
					<div class="flex justify-between px-1">
						{#each chartLabels as item, idx (idx)}
							<span class="font-mono text-[10px] text-muted-foreground">{item.label}</span>
						{/each}
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
