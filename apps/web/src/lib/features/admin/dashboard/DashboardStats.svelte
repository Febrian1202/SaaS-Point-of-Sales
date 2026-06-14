<script lang="ts">
	import { Coins, TrendingUp, Receipt, Wallet, ShoppingBag } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { formatRupiah } from '$lib/utils/';

	let { daily } = $props();
</script>

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
			<div class="font-tight text-2xl font-semibold text-foreground">
				{formatRupiah(daily?.retailRevenue || 0)}
			</div>
			<div class="mt-1 flex items-center gap-1">
				<TrendingUp class="size-4 text-primary" />
				<span class="font-mono text-[11px] font-medium text-primary">Hari Ini</span>
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
			<div class="font-tight text-2xl font-semibold text-foreground">
				{formatRupiah(daily?.brilinkCommission || 0)}
			</div>
			<div class="mt-1 flex items-center gap-1">
				<TrendingUp class="size-4 text-primary" />
				<span class="font-mono text-[11px] font-medium text-primary">Hari Ini</span>
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
			<div class="font-tight text-2xl font-semibold text-foreground">
				{daily?.itemsSold || 0} item
			</div>
			<span class="mt-1 block font-mono text-[11px] text-muted-foreground">Hari Ini</span>
		</Card.Content>
	</Card.Root>

	<!-- Card 4: Total Trx -->
	<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
		<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
			<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
				>Total Transaksi</span
			>
			<Receipt class="size-5 text-primary" />
		</Card.Header>
		<Card.Content>
			<div class="font-tight text-2xl font-semibold text-foreground">
				{daily?.trxCount || 0}
			</div>
			<span class="mt-1 block font-mono text-[11px] text-muted-foreground">Diproses</span>
		</Card.Content>
	</Card.Root>
</div>
