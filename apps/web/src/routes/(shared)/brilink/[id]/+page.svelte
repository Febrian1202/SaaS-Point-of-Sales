<script lang="ts">
	import { ArrowLeft, Landmark, FileText, CheckCircle2, Clock } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { formatRupiah } from '$lib/utils/index';
	import { BRILINK_TRX_TYPES } from '$lib/constants';
	import { base } from '$app/paths';

	let { data } = $props();
	const trx = $derived(data.transaction);
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="mx-auto max-w-2xl animate-in space-y-6 duration-500 fade-in slide-in-from-bottom-3">
	<div class="flex items-center">
		<Button
			variant="ghost"
			href="{base}/brilink"
			class="text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="mr-2 size-4" /> Kembali
		</Button>
	</div>

	<Card.Root class="overflow-hidden border-border bg-card">
		<!-- Header / Status Banner -->
		<div class="flex flex-col items-center border-b border-border bg-background/50 p-8">
			{#if trx.status === 'success'}
				<div
					class="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/20 text-primary"
				>
					<CheckCircle2 class="size-8" />
				</div>
				<h2 class="font-tight text-2xl font-bold text-foreground">Transaksi Berhasil</h2>
			{:else}
				<div
					class="mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
				>
					<Clock class="size-8" />
				</div>
				<h2 class="font-tight text-2xl font-bold text-foreground capitalize">{trx.status}</h2>
			{/if}

			<p
				class="mt-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-sm text-muted-foreground"
			>
				Ref: {trx.referenceNumber}
			</p>
		</div>

		<Card.Content class="p-0">
			<!-- Info Utama -->
			<div class="grid grid-cols-2 gap-y-6 p-8">
				<div>
					<p class="mb-1 font-mono text-xs tracking-wider text-muted-foreground uppercase">
						Jenis Transaksi
					</p>
					<Badge variant="secondary" class="font-mono text-xs">
						{BRILINK_TRX_TYPES.find((t) => t.value === trx.trxType)?.label || trx.trxType}
					</Badge>
				</div>

				<div class="text-right">
					<p class="mb-1 font-mono text-xs tracking-wider text-muted-foreground uppercase">
						Waktu Pencatatan
					</p>
					<p class="text-sm font-medium">
						{new Date(trx.createdAt || Date.now()).toLocaleString('id-ID', {
							dateStyle: 'long',
							timeStyle: 'short'
						})}
					</p>
				</div>

				<div>
					<p class="mb-1 font-mono text-xs tracking-wider text-muted-foreground uppercase">
						Kasir / Operator
					</p>
					<div class="flex items-center gap-2">
						<div
							class="flex size-6 items-center justify-center rounded-full bg-border text-[10px] font-bold"
						>
							{trx.cashier?.name?.substring(0, 2).toUpperCase() || 'OP'}
						</div>
						<p class="text-sm font-medium">{trx.cashier?.name || 'Sistem'}</p>
					</div>
				</div>

				{#if trx.notes}
					<div class="col-span-2 mt-2 rounded-lg border border-border bg-background/50 p-4">
						<p
							class="mb-2 flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase"
						>
							<FileText class="size-3" /> Catatan
						</p>
						<p class="text-sm text-foreground">{trx.notes}</p>
					</div>
				{/if}
			</div>

			<!-- Rincian Finansial -->
			<div class="border-t border-border bg-background/30 p-8">
				<h3 class="mb-4 font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
					Rincian Finansial
				</h3>

				<div class="space-y-4">
					<div class="flex items-center justify-between border-b border-border/50 pb-4">
						<span class="text-sm text-muted-foreground">Nominal Transaksi (Nasabah)</span>
						<span class="font-mono font-medium text-foreground"
							>{formatRupiah(Number(trx.customerAmount))}</span
						>
					</div>

					<div class="flex items-center justify-between border-b border-border/50 pb-4">
						<span class="text-sm text-muted-foreground">Biaya Admin EDC / Bank</span>
						<span class="font-mono font-medium text-destructive"
							>{formatRupiah(Number(trx.adminFeeCharged))}</span
						>
					</div>

					<div class="flex items-center justify-between pt-2">
						<span class="flex items-center gap-2 text-sm font-semibold text-primary">
							<Landmark class="size-4" /> Komisi Toko (Keuntungan Bersih)
						</span>
						<span class="font-mono text-xl font-bold text-primary"
							>+{formatRupiah(Number(trx.agentCommission))}</span
						>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
