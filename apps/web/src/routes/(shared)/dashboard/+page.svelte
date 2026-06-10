<script lang="ts">
	import { Plus, Search, ShoppingCart, TrendingUp, CircleDollarSign } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';

	let { data } = $props();
	const user = $derived(data?.user);
</script>

<svelte:head>
	<title>Transaksi | Kios Sheza</title>
</svelte:head>

<div class="animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-3">
	<!-- Header Section -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Dashboard Transaksi & Kasir
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Selamat datang kembali, kasir {user?.name || 'Staf'}. Kelola transaksi penjualan hari ini di
				sini.
			</p>
		</div>

		<!-- Single Accent CTA Button for cashier dashboard -->
		<Button
			class="h-11 rounded-md bg-primary font-tight text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
		>
			<Plus class="mr-2 size-4" />
			MULAI TRANSAKSI BARU
		</Button>
	</div>

	<!-- Stats Grid (Cashier Specific) -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<!-- Shift Sales -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Penjualan Shift Ini</span
				>
				<CircleDollarSign class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				<div class="font-tight text-2xl font-semibold text-foreground">Rp 1.820.000</div>
				<span class="mt-1 block font-mono text-[11px] text-muted-foreground"
					>12 Transaksi Berhasil</span
				>
			</Card.Content>
		</Card.Root>

		<!-- Active Cart Items -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Keranjang Aktif</span
				>
				<ShoppingCart class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				<div class="font-tight text-2xl font-semibold text-foreground">3 Item</div>
				<span class="mt-1 block font-mono text-[11px] text-muted-foreground"
					>Sedang dalam antrean</span
				>
			</Card.Content>
		</Card.Root>

		<!-- Avg Transaction Value -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Rata-rata Struk</span
				>
				<TrendingUp class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				<div class="font-tight text-2xl font-semibold text-foreground">Rp 151.600</div>
				<span class="mt-1 block font-mono text-[11px] text-muted-foreground">Stabil hari ini</span>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Main Workspace -->
	<Card.Root class="gap-0 overflow-hidden border-border bg-card pt-0 pb-0">
		<Card.Header
			class="flex flex-col items-start justify-between gap-4 border-b border-border bg-background/30 p-4 sm:flex-row sm:items-center"
		>
			<div>
				<Card.Title class="font-tight text-lg text-foreground">Log Transaksi Hari Ini</Card.Title>
				<p class="mt-0.5 text-xs text-muted-foreground">
					Daftar transaksi kasir yang tercatat untuk shift ini
				</p>
			</div>
			<!-- Search Transactions -->
			<div class="relative w-full max-w-xs">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					class="w-full border-border bg-background pr-4 pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0"
					placeholder="Cari transaksi (ID / Nama)..."
					type="text"
				/>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			<Table.Root>
				<Table.Header class="border-b border-border bg-background/20">
					<Table.Row class="border-b border-border hover:bg-transparent">
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>ID Transaksi</Table.Head
						>
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Waktu</Table.Head
						>
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Item</Table.Head
						>
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Total Bayar</Table.Head
						>
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Status</Table.Head
						>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each [{ id: '#TRX-90812', time: '15:30', items: 'Rokok Sampoerna Mild, Kopi Sachet', total: 'Rp 45.000', status: 'SUKSES' }, { id: '#TRX-90811', time: '14:45', items: 'Minyak Goreng 1L, Sabun Lifebuoy', total: 'Rp 23.500', status: 'SUKSES' }, { id: '#TRX-90810', time: '14:12', items: 'Tarik Tunai Brilink', total: 'Rp 500.000', status: 'SUKSES' }] as trx (trx.id)}
						<Table.Row class="border-b border-border/50 transition-colors hover:bg-border/10">
							<Table.Cell class="px-4 py-3 font-mono text-xs text-foreground">{trx.id}</Table.Cell>
							<Table.Cell class="px-4 py-3 text-sm text-foreground">{trx.time}</Table.Cell>
							<Table.Cell class="px-4 py-3 text-sm text-foreground">{trx.items}</Table.Cell>
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
</div>
