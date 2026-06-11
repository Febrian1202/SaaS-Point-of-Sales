<script lang="ts">
	import {
		Plus,
		TrendingUp,
		ShoppingBag,
		Receipt,
		Coins,
		Wallet,
		Sparkles,
		Coffee,
		TriangleAlert
	} from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	let { data } = $props();
	const user = $derived(data?.user);
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
				<div class="font-tight text-2xl font-semibold text-foreground">Rp 2.450.000</div>
				<div class="mt-1 flex items-center gap-1">
					<TrendingUp class="size-4 text-primary" />
					<span class="font-mono text-[11px] font-medium text-primary">+12.5%</span>
				</div>
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
				<div class="font-tight text-2xl font-semibold text-foreground">Rp 125.000</div>
				<div class="mt-1 flex items-center gap-1">
					<TrendingUp class="size-4 text-primary" />
					<span class="font-mono text-[11px] font-medium text-primary">+8.2%</span>
				</div>
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
				<div class="font-tight text-2xl font-semibold text-foreground">87 item</div>
				<span class="mt-1 block font-mono text-[11px] text-muted-foreground">Today</span>
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
				<div class="font-tight text-2xl font-semibold text-foreground">34</div>
				<span class="mt-1 block font-mono text-[11px] text-muted-foreground">Processed</span>
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

		<div class="relative h-64 w-full overflow-hidden">
			<!-- Chart Bars -->
			<div class="absolute bottom-0 left-0 flex h-full w-full items-end justify-between gap-2 px-2">
				<div
					class="w-full rounded-t-sm border-t-2 border-primary bg-primary/20"
					style="height: 45%;"
				></div>
				<div
					class="w-full rounded-t-sm border-t-2 border-primary bg-primary/20"
					style="height: 60%;"
				></div>
				<div
					class="w-full rounded-t-sm border-t-2 border-primary bg-primary/20"
					style="height: 55%;"
				></div>
				<div
					class="w-full rounded-t-sm border-t-2 border-primary bg-primary/20"
					style="height: 80%;"
				></div>
				<div
					class="w-full rounded-t-sm border-t-2 border-primary bg-primary/20"
					style="height: 70%;"
				></div>
				<div
					class="w-full rounded-t-sm border-t-4 border-primary bg-primary/30"
					style="height: 95%;"
				></div>
				<div
					class="w-full rounded-t-sm border-t-2 border-primary bg-primary/20"
					style="height: 85%;"
				></div>
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
			<span class="font-mono text-[10px] text-muted-foreground">MON</span>
			<span class="font-mono text-[10px] text-muted-foreground">TUE</span>
			<span class="font-mono text-[10px] text-muted-foreground">WED</span>
			<span class="font-mono text-[10px] text-muted-foreground">THU</span>
			<span class="font-mono text-[10px] text-muted-foreground">FRI</span>
			<span class="font-mono text-[10px] font-bold text-primary">SAT (TODAY)</span>
			<span class="font-mono text-[10px] text-muted-foreground">SUN</span>
		</div>
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
						{#each [{ id: '#KS-8821', product: 'Rokok Sampoerna Mild', total: 'Rp 32.000', status: 'LUNAS' }, { id: '#KS-8820', product: 'Tarik Tunai Brilink', total: 'Rp 500.000', status: 'LUNAS' }, { id: '#KS-8819', product: 'Minyak Goreng 1L', total: 'Rp 18.500', status: 'LUNAS' }] as trx (trx.id)}
							<Table.Row class="border-b border-border/50 transition-colors hover:bg-border/10">
								<Table.Cell class="px-4 py-3 font-mono text-xs text-foreground">{trx.id}</Table.Cell
								>
								<Table.Cell class="px-4 py-3 text-sm text-foreground">{trx.product}</Table.Cell>
								<Table.Cell class="px-4 py-3 font-mono text-xs text-foreground"
									>{trx.total}</Table.Cell
								>
								<Table.Cell class="px-4 py-3">
									<Badge
										class="rounded-sm border-transparent bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary select-none"
									>
										<span class="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
										{trx.status}
									</Badge>
								</Table.Cell>
							</Table.Row>
						{/each}
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
				<!-- Warning Item 1 -->
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
							<h5 class="text-sm font-semibold text-foreground">Sabun Mandi Lifebuoy</h5>
							<p
								class="mt-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>
								Category: Kebersihan
							</p>
						</div>
					</div>
					<div class="text-right">
						<div class="flex items-center gap-1 text-sm font-bold text-destructive">
							<TriangleAlert class="size-4" />
							<span class="font-mono">5 pcs</span>
						</div>
						<Button
							variant="link"
							class="mt-1 h-auto p-0 font-mono text-[10px] tracking-wider text-primary uppercase hover:underline"
						>
							Restock
						</Button>
					</div>
				</div>

				<!-- Warning Item 2 -->
				<div
					class="flex items-center justify-between rounded-lg border border-border bg-background p-4"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-12 w-12 items-center justify-center rounded border border-border bg-card"
						>
							<Coffee class="size-5 text-muted-foreground" />
						</div>
						<div>
							<h5 class="text-sm font-semibold text-foreground">Kopi Sachet Kapal Api</h5>
							<p
								class="mt-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>
								Category: Minuman
							</p>
						</div>
					</div>
					<div class="text-right">
						<div class="flex items-center gap-1 text-sm font-bold text-destructive">
							<TriangleAlert class="size-4" />
							<span class="font-mono">12 pcs</span>
						</div>
						<Button
							variant="link"
							class="mt-1 h-auto p-0 font-mono text-[10px] tracking-wider text-primary uppercase hover:underline"
						>
							Restock
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
