<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import { api } from '$lib/api/client';
	import { formatRupiah } from '$lib/utils/index';
	import { X, Calendar, User, CreditCard, Receipt } from 'lucide-svelte';

	let {
		open = $bindable(false),
		transactionId
	}: {
		open: boolean;
		transactionId: string;
	} = $props();

	type DetailItem = {
		id: string;
		qty: number;
		unitPrice: string;
		subtotal: string;
		createdAt: Date | string;
		product: {
			id: string;
			name: string;
			createdAt: Date | string;
		};
	};

	type TrxDetail = {
		trxNumber: string;
		totalAmount: string | number;
		amountPaid: string | number;
		changeAmount: string | number;
		paymentMethod: string;
		createdAt: Date | string;
		items: DetailItem[];
	};

	let loading = $state(false);
	let errorMsg = $state('');
	let detail = $state<TrxDetail | null>(null);

	async function fetchDetail(id: string) {
		if (!id) return;
		loading = true;
		errorMsg = '';
		detail = null;

		try {
			const res = await api.transactions[id].get();
			if (res.data?.success) {
				detail = res.data.data as unknown as TrxDetail;
			} else {
				errorMsg = res.data?.message || 'Gagal memuat detail transaksi.';
			}
		} catch (err) {
			errorMsg = 'Terjadi kesalahan jaringan atau server.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open && transactionId) {
			fetchDetail(transactionId);
		}
	});

	function formatFullDate(dateStr: string | Date | undefined) {
		if (!dateStr) return '-';
		const d = new Date(dateStr);
		return d.toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[500px] border-border bg-card p-6 text-foreground shadow-2xl">
		<Dialog.Header class="space-y-1">
			<Dialog.Title class="flex items-center gap-2 font-tight text-xl font-semibold">
				<Receipt class="size-5 text-primary" />
				Detail Transaksi
			</Dialog.Title>
			<Dialog.Description class="font-mono text-xs text-muted-foreground uppercase">
				ID: {transactionId || '-'}
			</Dialog.Description>
		</Dialog.Header>

		{#if loading}
			<div class="space-y-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<Skeleton class="h-10 rounded-md bg-border/40" />
					<Skeleton class="h-10 rounded-md bg-border/40" />
				</div>
				<Skeleton class="h-32 rounded-lg bg-border/40" />
				<div class="space-y-2">
					<Skeleton class="h-4 w-full bg-border/40" />
					<Skeleton class="h-4 w-5/6 bg-border/40" />
				</div>
			</div>
		{:else if errorMsg}
			<div class="flex flex-col items-center justify-center gap-2 py-8 text-center">
				<span class="font-mono text-sm text-destructive">{errorMsg}</span>
				<Button variant="outline" size="sm" onclick={() => fetchDetail(transactionId)}>Coba Lagi</Button>
			</div>
		{:else if detail}
			<div class="space-y-6 py-4">
				<!-- Metadata Grid -->
				<div class="grid grid-cols-2 gap-4 rounded-lg border border-border bg-background/50 p-4 font-mono text-xs text-secondary-foreground">
					<div class="space-y-1">
						<span class="block text-[10px] text-muted-foreground uppercase">No. Struk</span>
						<span class="font-semibold text-foreground">{detail.trxNumber}</span>
					</div>
					<div class="space-y-1 text-right">
						<span class="block text-[10px] text-muted-foreground uppercase">Metode Pembayaran</span>
						<Badge variant="outline" class="border-border bg-background text-[10px] font-bold uppercase">
							{detail.paymentMethod}
						</Badge>
					</div>
					<div class="space-y-1">
						<span class="block text-[10px] text-muted-foreground uppercase">Tgl & Waktu</span>
						<span class="text-foreground">{formatFullDate(detail.createdAt)}</span>
					</div>
				</div>

				<!-- Items Table -->
				<div class="space-y-2">
					<span class="font-mono text-xs text-secondary-foreground uppercase">Daftar Belanja</span>
					<div class="max-h-48 overflow-y-auto rounded-lg border border-border bg-background/25">
						<table class="w-full border-collapse text-left text-xs">
							<thead>
								<tr class="border-b border-border bg-muted/20 font-mono text-muted-foreground uppercase">
									<th class="p-3">Produk</th>
									<th class="p-3 text-center">Qty</th>
									<th class="p-3 text-right">Harga</th>
									<th class="p-3 text-right">Subtotal</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border/50">
								{#each detail.items as item (item.id)}
									<tr class="text-secondary-foreground hover:bg-muted/30">
										<td class="p-3 font-medium text-foreground">{item.product?.name || 'Produk'}</td>
										<td class="p-3 text-center font-mono">{item.qty}</td>
										<td class="p-3 text-right font-mono">{formatRupiah(item.unitPrice)}</td>
										<td class="p-3 text-right font-mono text-foreground font-semibold">
											{formatRupiah(item.subtotal)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- Payment Details Summary -->
				<div class="space-y-2 rounded-lg border border-border bg-background/30 p-4 font-mono text-xs">
					<div class="flex justify-between py-1">
						<span class="text-muted-foreground">TOTAL BELANJA</span>
						<span class="font-bold text-foreground text-sm">{formatRupiah(detail.totalAmount)}</span>
					</div>
					<div class="flex justify-between py-1">
						<span class="text-muted-foreground">UANG DIBAYAR</span>
						<span class="text-foreground">{formatRupiah(detail.amountPaid)}</span>
					</div>
					<div class="border-t border-border/50 my-1 pt-1 flex justify-between font-semibold">
						<span class="text-muted-foreground">KEMBALIAN</span>
						<span class="text-primary">{formatRupiah(detail.changeAmount)}</span>
					</div>
				</div>
			</div>
		{/if}

		<Dialog.Footer class="sm:justify-end border-t border-border pt-4">
			<Button variant="outline" class="font-mono text-xs" onclick={() => (open = false)}>Tutup</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
