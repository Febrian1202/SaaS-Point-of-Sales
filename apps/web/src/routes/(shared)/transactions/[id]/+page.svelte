<script lang="ts">
	import { ArrowLeft, Printer, ShoppingCart } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { formatRupiah } from '$lib/utils/index';
	import { base } from '$app/paths';

	let { data } = $props();
	const trx = $derived(data.transaction);
	const user = $derived(data.user);

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<!-- Mode Layar (Tidak diprint) -->
<div
	class="mx-auto max-w-2xl animate-in space-y-6 duration-500 fade-in slide-in-from-bottom-3 print:hidden"
>
	<div class="flex items-center justify-between">
		<Button
			variant="ghost"
			href="{base}/transactions"
			class="text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="mr-2 size-4" /> Kembali
		</Button>
		<Button onclick={handlePrint} class="bg-primary font-semibold text-primary-foreground">
			<Printer class="mr-2 size-4" /> Cetak Struk
		</Button>
	</div>

	<Card.Root class="overflow-hidden border-border bg-card">
		<!-- Tampilan Mock Struk di Layar -->
		<div
			class="flex flex-col items-center border-b border-dashed border-border bg-background/50 p-8"
		>
			<div class="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/20">
				<ShoppingCart class="size-6 text-primary" />
			</div>
			<h2 class="font-tight text-xl font-bold">{user?.tenantName || 'Transa Store'}</h2>
			<p class="mt-1 w-64 text-center text-xs text-muted-foreground">Struk Pembelian</p>
		</div>

		<Card.Content class="space-y-6 p-8 pt-6">
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<p class="mb-1 text-xs text-muted-foreground">No. Transaksi</p>
					<p class="font-mono font-semibold">{trx.trxNumber}</p>
				</div>
				<div class="text-right">
					<p class="mb-1 text-xs text-muted-foreground">Waktu</p>
					<p class="font-medium">
						{new Date(trx.createdAt || Date.now()).toLocaleString('id-ID', {
							dateStyle: 'medium',
							timeStyle: 'short'
						})}
					</p>
				</div>
				<div>
					<p class="mb-1 text-xs text-muted-foreground">Kasir</p>
					<p class="font-medium">{(trx as any).cashier?.name || user?.name || '-'}</p>
				</div>
				<div class="text-right">
					<p class="mb-1 text-xs text-muted-foreground">Metode Bayar</p>
					<p class="font-medium uppercase">{trx.paymentMethod}</p>
				</div>
			</div>

			<div class="border-t border-border pt-4">
				<p class="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
					Item Pembelian
				</p>
				<div class="space-y-3">
					{#each trx.items as item, i (i)}
						<div class="flex items-start justify-between text-sm">
							<div class="flex-1 pr-4">
								<p class="font-medium">{item.product?.name}</p>
								<p class="mt-0.5 text-xs text-muted-foreground">
									{item.qty} x {formatRupiah(Number(item.unitPrice))}
								</p>
							</div>
							<p class="font-mono font-semibold">{formatRupiah(Number(item.subtotal))}</p>
						</div>
					{/each}
				</div>
			</div>

			<div class="space-y-2 border-t border-border pt-4 text-sm">
				<div class="flex justify-between">
					<p class="text-muted-foreground">Total Belanja</p>
					<p class="font-mono text-lg font-bold text-foreground">
						{formatRupiah(Number(trx.totalAmount))}
					</p>
				</div>
				<div class="flex justify-between">
					<p class="text-muted-foreground">Dibayar</p>
					<p class="font-mono">{formatRupiah(Number(trx.amountPaid))}</p>
				</div>
				<div class="flex justify-between text-primary">
					<p class="font-semibold">Kembalian</p>
					<p class="font-mono font-bold">{formatRupiah(Number(trx.changeAmount))}</p>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<div class="mx-auto hidden w-[58mm] p-2 font-mono text-[10px] leading-tight text-black print:block">
	<div class="mb-4 text-center">
		<h1 class="text-sm font-bold">{user?.tenantName || 'Transa Store'}</h1>
	</div>

	<div class="mb-3 border-b border-dashed border-black pb-2">
		<div class="flex justify-between">
			<span>No:</span>
			<span>{trx.trxNumber}</span>
		</div>
		<div class="flex justify-between">
			<span>Tgl:</span>
			<span
				>{new Date(trx.createdAt || Date.now()).toLocaleString('id-ID', {
					dateStyle: 'short',
					timeStyle: 'short'
				})}</span
			>
		</div>
		<div class="flex justify-between">
			<span>Ksr:</span>
			<span>{(trx as any).cashier?.name || user?.name || '-'}</span>
		</div>
	</div>

	<div class="mb-3 space-y-2 border-b border-dashed border-black pb-2">
		{#each trx.items as item, i (i)}
			<div>
				<div class="truncate font-bold">{item.product?.name}</div>
				<div class="flex justify-between">
					<span>{item.qty} x {Number(item.unitPrice).toLocaleString('id-ID')}</span>
					<span>{Number(item.subtotal).toLocaleString('id-ID')}</span>
				</div>
			</div>
		{/each}
	</div>

	<div class="mb-4 space-y-1">
		<div class="flex justify-between font-bold">
			<span>TOTAL</span>
			<span>{Number(trx.totalAmount).toLocaleString('id-ID')}</span>
		</div>
		<div class="flex justify-between">
			<span>BAYAR ({trx.paymentMethod.toUpperCase()})</span>
			<span>{Number(trx.amountPaid).toLocaleString('id-ID')}</span>
		</div>
		<div class="flex justify-between">
			<span>KEMBALI</span>
			<span>{Number(trx.changeAmount).toLocaleString('id-ID')}</span>
		</div>
	</div>

	<div class="mt-6 border-t border-dashed border-black pt-2 text-center">
		<p>Terima Kasih</p>
	</div>
</div>

<!-- Mode Print (Hanya tampil saat diprint) -->
<style>
	@media print {
		@page {
			margin: 0;
			size: 58mm 210mm; /* Ukuran thermal printer standard */
		}

		.print\:block {
			display: block !important;
		}
		.print\:hidden {
			display: none !important;
		}
	}
</style>
