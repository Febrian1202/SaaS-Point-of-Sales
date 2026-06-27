<script lang="ts">
	import { Plus, ShoppingCart, TrendingUp, CircleDollarSign } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { formatRupiah } from '$lib/utils/index';
	import type { TrxItem } from '$lib/types/ui';

	let { data } = $props();
	const user = $derived(data?.user);
</script>

<svelte:head>
	<title>{data.title || 'Dasbor | Transa'}</title>
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
			href="/pos"
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
				{#await data.streamed.transactions}
					<Skeleton class="h-8 w-32" />
					<Skeleton class="mt-2 h-4 w-24" />
				{:then res}
					{@const trxList = res?.data || []}
					{@const totalAmt = trxList.reduce(
						(sum: number, t: any) => sum + Number(t.totalAmount),
						0
					)}
					<div class="font-tight text-2xl font-semibold text-foreground">
						{formatRupiah(totalAmt)}
					</div>
					<span class="mt-1 block font-mono text-[11px] text-muted-foreground"
						>{trxList.length} Transaksi Berhasil</span
					>
				{/await}
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
				{#await data.streamed.transactions}
					<Skeleton class="h-8 w-32" />
					<Skeleton class="mt-2 h-4 w-24" />
				{:then res}
					{@const trxList = res?.data || []}
					{@const totalAmt = trxList.reduce(
						(sum: number, t: any) => sum + Number(t.totalAmount),
						0
					)}
					{@const avg = trxList.length > 0 ? totalAmt / trxList.length : 0}
					<div class="font-tight text-2xl font-semibold text-foreground">{formatRupiah(avg)}</div>
					<span class="mt-1 block font-mono text-[11px] text-muted-foreground"
						>Berdasarkan trx hari ini</span
					>
				{/await}
			</Card.Content>
		</Card.Root>

		<!-- Info Card -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Status Sistem</span
				>
				<ShoppingCart class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				<div class="font-tight text-2xl font-semibold text-foreground">Aktif</div>
				<span class="mt-1 block font-mono text-[11px] text-muted-foreground"
					>Siap melayani pelanggan</span
				>
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
					Daftar transaksi kasir yang tercatat untuk shift ini (terbaru di atas)
				</p>
			</div>
			<!-- Search (Disabled in dummy view, functionality in /transactions list) -->
			<Button variant="outline" href="/transactions" class="border-border">
				Lihat Semua Riwayat
			</Button>
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
							>Total Bayar</Table.Head
						>
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Metode</Table.Head
						>
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Status</Table.Head
						>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#await data.streamed.transactions}
						{#each Array(5) as _, i (i)}
							<Table.Row class="border-b border-border/50">
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-24" /></Table.Cell>
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-16" /></Table.Cell>
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-20" /></Table.Cell>
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-16" /></Table.Cell>
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-16" /></Table.Cell>
							</Table.Row>
						{/each}
					{:then res}
						{#if res?.data && res.data.length > 0}
							{#each res.data as trx: TrxItem (trx.id)}
								<Table.Row class="border-b border-border/50 transition-colors hover:bg-border/10">
									<Table.Cell class="px-4 py-3 font-mono text-xs text-foreground"
										>{trx.trxNumber}</Table.Cell
									>
									<Table.Cell class="px-4 py-3 text-sm text-foreground">
										{new Date(trx.createdAt).toLocaleTimeString('id-ID', {
											hour: '2-digit',
											minute: '2-digit'
										})}
									</Table.Cell>
									<Table.Cell class="px-4 py-3 font-mono text-xs text-foreground"
										>{formatRupiah(Number(trx.totalAmount))}</Table.Cell
									>
									<Table.Cell class="px-4 py-3 text-sm text-foreground uppercase"
										>{trx.paymentMethod}</Table.Cell
									>
									<Table.Cell class="px-4 py-3">
										<Badge
											class="rounded-sm border-transparent {trx.status === 'success'
												? 'bg-primary/10 text-primary'
												: 'bg-destructive/10 text-destructive'} px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase select-none"
										>
											{#if trx.status === 'success'}
												<span class="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
												></span>
											{/if}
											{trx.status}
										</Badge>
									</Table.Cell>
								</Table.Row>
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colspan={5} class="h-24 text-center text-muted-foreground">
									Belum ada transaksi hari ini.
								</Table.Cell>
							</Table.Row>
						{/if}
					{/await}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
