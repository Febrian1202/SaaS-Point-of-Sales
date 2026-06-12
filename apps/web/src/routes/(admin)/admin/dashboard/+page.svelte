<script lang="ts">
	import {
		Plus,
		TrendingUp,
		ShoppingBag,
		Receipt,
		Coins,
		Wallet,
		Sparkles,
		TriangleAlert
	} from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	
	const user = $derived(data?.user);

	function formatRupiah(value: number | string | null | undefined) {
		if (value === null || value === undefined) return 'Rp 0';
		const num = typeof value === 'string' ? parseFloat(value) : value;
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(num);
	}

	function getProductDisplay(items: Array<{ product?: { name: string } }>) {
		if (!items || items.length === 0) return '-';
		const firstName = items[0]?.product?.name || 'Produk';
		if (items.length > 1) {
			return `${firstName} (+${items.length - 1} lainnya)`;
		}
		return firstName;
	}
</script>

<svelte:head>
	<title>Dashboard Admin | Kios Sheza</title>
</svelte:head>

<div class="animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-3">
	<!-- Header Section with Single Accent CTA -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Selamat Datang, {user?.name || 'Admin'}
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Berikut adalah ringkasan operasional toko Anda hari ini.
			</p>
		</div>

		<!-- The Sole Tertiary Accent Button (CTA) for the screen -->
		<Button
			class="h-11 rounded-md bg-primary font-tight text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
		>
			<Plus class="mr-2 size-4" />
			TRANSAKSI BARU
		</Button>
	</div>

	<!-- Stats Grid (Graphite Card Surfaces) -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Card 1: Omzet Retail -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Omzet Retail</span
				>
				<Coins class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				{#await data.daily}
					<div class="h-8 w-28 animate-pulse rounded bg-border"></div>
					<div class="mt-2 h-4 w-16 animate-pulse rounded bg-border"></div>
				{:then daily}
					<div class="font-tight text-2xl font-semibold text-foreground">
						{formatRupiah(daily?.retailRevenue)}
					</div>
					<div class="mt-1 flex items-center gap-1">
						<TrendingUp class="size-4 text-primary" />
						<span class="font-mono text-[11px] font-medium text-primary">Hari Ini</span>
					</div>
				{/await}
			</Card.Content>
		</Card.Root>

		<!-- Card 2: Komisi Brilink -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Komisi Brilink</span
				>
				<Wallet class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				{#await data.daily}
					<div class="h-8 w-28 animate-pulse rounded bg-border"></div>
					<div class="mt-2 h-4 w-16 animate-pulse rounded bg-border"></div>
				{:then daily}
					<div class="font-tight text-2xl font-semibold text-foreground">
						{formatRupiah(daily?.brilinkCommission)}
					</div>
					<div class="mt-1 flex items-center gap-1">
						<TrendingUp class="size-4 text-primary" />
						<span class="font-mono text-[11px] font-medium text-primary">Hari Ini</span>
					</div>
				{/await}
			</Card.Content>
		</Card.Root>

		<!-- Card 3: Produk Terjual -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Produk Terjual</span
				>
				<ShoppingBag class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				{#await data.daily}
					<div class="h-8 w-20 animate-pulse rounded bg-border"></div>
					<div class="mt-2 h-4 w-12 animate-pulse rounded bg-border"></div>
				{:then daily}
					<div class="font-tight text-2xl font-semibold text-foreground">
						{daily?.itemsSold || 0} item
					</div>
					<span class="mt-1 block font-mono text-[11px] text-muted-foreground">Today</span>
				{/await}
			</Card.Content>
		</Card.Root>

		<!-- Card 4: Total Trx -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Total Trx</span
				>
				<Receipt class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				{#await data.daily}
					<div class="h-8 w-12 animate-pulse rounded bg-border"></div>
					<div class="mt-2 h-4 w-16 animate-pulse rounded bg-border"></div>
				{:then daily}
					<div class="font-tight text-2xl font-semibold text-foreground">
						{daily?.trxCount || 0}
					</div>
					<span class="mt-1 block font-mono text-[11px] text-muted-foreground">Processed</span>
				{/await}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Revenue Chart Area -->
	<Card.Root class="border-border bg-card p-6">
		<div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
			<div>
				<h4 class="font-tight text-lg font-semibold text-foreground">Revenue Trend</h4>
				<p class="text-sm text-muted-foreground">Visualizing performance over the last 7 days</p>
			</div>
			<div class="flex rounded-lg border border-border bg-background p-1">
				<Button
					variant="secondary"
					size="sm"
					class="h-7 rounded-md bg-border px-3 font-mono text-[10px] tracking-wider text-foreground uppercase hover:bg-border/80"
				>
					Daily
				</Button>
				<Button
					variant="ghost"
					size="sm"
					class="h-7 rounded-md px-3 font-mono text-[10px] tracking-wider text-muted-foreground uppercase hover:text-foreground"
				>
					Weekly
				</Button>
			</div>
		</div>

		{#await data.range}
			<div class="flex h-64 w-full items-end justify-between gap-2 px-2">
				{#each Array(7) as _, i (i)}
					<div class="h-32 w-full animate-pulse rounded bg-border/40" data-val={_}></div>
				{/each}
			</div>
			<div class="mt-4 flex justify-between px-2">
				{#each Array(7) as _, i (i)}
					<div class="h-4 w-8 animate-pulse rounded bg-border/40" data-val={_}></div>
				{/each}
			</div>
		{:then range}
			{@const maxRevenue = Math.max(...range.map((r) => r.retailRevenue), 1)}
			{@const chartBars = range.map((day) => {
				const height = maxRevenue > 1 ? (day.retailRevenue / maxRevenue) * 95 : 5;
				return {
					dayName: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
					height: `${Math.max(5, height)}%`,
					revenue: day.retailRevenue,
					isToday: day.date === new Date().toISOString().substring(0, 10)
				};
			})}
			<div class="relative h-64 w-full overflow-hidden">
				<!-- Chart Bars -->
				<div class="absolute bottom-0 left-0 flex h-full w-full items-end justify-between gap-2 px-2">
					{#each chartBars as bar (bar.dayName)}
						<div
							class="w-full rounded-t-sm transition-all duration-500 {bar.isToday ? 'border-t-4 border-primary bg-primary/30' : 'border-t-2 border-primary bg-primary/20'}"
							style="height: {bar.height};"
							title="{bar.dayName}: {formatRupiah(bar.revenue)}"
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
			<div class="mt-4 flex justify-between px-2">
				{#each chartBars as bar (bar.dayName)}
					<span 
						class="font-mono text-[10px] {bar.isToday ? 'font-bold text-primary' : 'text-muted-foreground'}"
					>
						{bar.dayName}{bar.isToday ? ' (TODAY)' : ''}
					</span>
				{/each}
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
					View All
				</Button>
			</Card.Header>
			<Card.Content class="p-0">
				<Table.Root>
					<Table.Header class="border-b border-border bg-background/20">
						<Table.Row class="border-b border-border hover:bg-transparent">
							<Table.Head
								class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
								>INV ID</Table.Head
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
						{#await data.transactions}
							{#each Array(3) as _, i (i)}
								<Table.Row class="border-b border-border/50" data-val={_}>
									<Table.Cell class="px-4 py-3"><div class="h-4 w-16 animate-pulse rounded bg-border/40"></div></Table.Cell>
									<Table.Cell class="px-4 py-3"><div class="h-4 w-32 animate-pulse rounded bg-border/40"></div></Table.Cell>
									<Table.Cell class="px-4 py-3"><div class="h-4 w-20 animate-pulse rounded bg-border/40"></div></Table.Cell>
									<Table.Cell class="px-4 py-3"><div class="h-5 w-12 animate-pulse rounded bg-border/40"></div></Table.Cell>
								</Table.Row>
							{/each}
						{:then transactions}
							{#if transactions.length === 0}
								<Table.Row>
									<Table.Cell colspan={4} class="text-center py-8 text-sm text-muted-foreground">
										Belum ada transaksi hari ini.
									</Table.Cell>
								</Table.Row>
							{:else}
								{#each transactions as trx (trx.id)}
									<Table.Row class="border-b border-border/50 transition-colors hover:bg-border/10">
										<Table.Cell class="px-4 py-3 font-mono text-xs text-foreground">{trx.trxNumber}</Table.Cell>
										<Table.Cell class="px-4 py-3 text-sm text-foreground">{getProductDisplay(trx.items)}</Table.Cell>
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
					CRITICAL
				</Badge>
			</Card.Header>
			<Card.Content class="space-y-4 p-4">
				{#await data.lowStock}
					{#each Array(2) as _, i (i)}
						<div class="flex items-center justify-between rounded-lg border border-border bg-background p-4 animate-pulse" data-val={_}>
							<div class="flex items-center gap-3">
								<div class="h-12 w-12 rounded border border-border bg-card"></div>
								<div class="space-y-2">
									<div class="h-4 w-32 rounded bg-border/40"></div>
									<div class="h-3 w-20 rounded bg-border/40"></div>
								</div>
							</div>
							<div class="space-y-2 text-right">
								<div class="h-4 w-12 rounded bg-border/40 ml-auto"></div>
								<div class="h-3 w-10 rounded bg-border/40 ml-auto"></div>
							</div>
						</div>
					{/each}
				{:then lowStock}
					{#if lowStock.length === 0}
						<div class="text-center py-8 text-sm text-muted-foreground">
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
											Category: {product.category?.name || 'Umum'}
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
										Restock
									</Button>
								</div>
							</div>
						{/each}
					{/if}
				{/await}
			</Card.Content>
		</Card.Root>
	</div>
</div>
