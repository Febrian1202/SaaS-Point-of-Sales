<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import { api } from '$lib/api/client';
	import { formatRupiah } from '$lib/utils/index';
	import { Wallet } from 'lucide-svelte';

	let {
		open = $bindable(false),
		transactionId
	}: {
		open: boolean;
		transactionId: string;
	} = $props();

	type BrilinkDetail = {
		id: string;
		referenceNumber: string;
		trxType: string;
		customerAmount: string | number;
		adminFeeCharged: string | number;
		agentCommission: string | number;
		status: string;
		notes: string | null;
		createdAt: Date | string;
		cashier: {
			name: string;
		} | null;
	};

	let loading = $state(false);
	let errorMsg = $state('');
	let detail = $state<BrilinkDetail | null>(null);

	async function fetchDetail(id: string) {
		if (!id) return;
		loading = true;
		errorMsg = '';
		detail = null;

		try {
			const res = await api.brilink[id].get();
			if (res.data?.success) {
				detail = res.data.data as unknown as BrilinkDetail;
			} else {
				errorMsg = res.data?.message || 'Gagal memuat detail transaksi BRILink.';
			}
		} catch (err) {
			console.error(err);
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

	const typeLabels: Record<string, { label: string; color: string }> = {
		transfer: { label: 'Transfer', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
		tarik_tunai: {
			label: 'Tarik Tunai',
			color: 'bg-green-500/10 text-green-500 border-green-500/20'
		},
		pembayaran: {
			label: 'Pembayaran',
			color: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
		},
		'e-wallet': {
			label: 'E-Wallet',
			color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
		},
		other: { label: 'Lainnya', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="border-border bg-card p-6 text-foreground shadow-2xl sm:max-w-125">
		<Dialog.Header class="space-y-1">
			<Dialog.Title class="flex items-center gap-2 font-tight text-xl font-semibold">
				<Wallet class="size-5 text-primary" />
				Detail Transaksi BRILink
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
				<Button variant="outline" size="sm" onclick={() => fetchDetail(transactionId)}
					>Coba Lagi</Button
				>
			</div>
		{:else if detail}
			<div class="space-y-6 py-4">
				<!-- Metadata Grid -->
				<div
					class="grid grid-cols-2 gap-4 rounded-lg border border-border bg-background/50 p-4 font-mono text-xs text-secondary-foreground"
				>
					<div class="space-y-1">
						<span class="block text-[10px] text-muted-foreground uppercase">No. Referensi</span>
						<span class="font-semibold text-foreground">{detail.referenceNumber}</span>
					</div>
					<div class="space-y-1 text-right">
						<span class="block text-[10px] text-muted-foreground uppercase">Jenis Transaksi</span>
						{#if detail.trxType}
							{@const typeInfo = typeLabels[detail.trxType] || typeLabels['other']}
							<Badge
								variant="outline"
								class="border-border text-[10px] font-bold uppercase {typeInfo.color}"
							>
								{typeInfo.label}
							</Badge>
						{/if}
					</div>
					<div class="space-y-1">
						<span class="block text-[10px] text-muted-foreground uppercase">Tgl & Waktu</span>
						<span class="text-foreground">{formatFullDate(detail.createdAt)}</span>
					</div>
					<div class="space-y-1 text-right">
						<span class="block text-[10px] text-muted-foreground uppercase">Kasir</span>
						<span class="text-foreground">{detail.cashier?.name || '-'}</span>
					</div>
					<div class="col-span-2 space-y-1">
						<span class="block text-[10px] text-muted-foreground uppercase">Status</span>
						{#if detail.status === 'success'}
							<Badge variant="outline" class="border-primary/20 bg-primary/10 text-primary">
								Berhasil
							</Badge>
						{:else}
							<Badge
								variant="outline"
								class="border-destructive/20 bg-destructive/10 text-destructive"
							>
								Dibatalkan (Void)
							</Badge>
						{/if}
					</div>
				</div>

				<!-- Detail Breakdown -->
				<div
					class="space-y-2 rounded-lg border border-border bg-background/30 p-4 font-mono text-xs"
				>
					<div class="flex justify-between py-1">
						<span class="text-muted-foreground">NOMINAL UANG</span>
						<span class="font-semibold text-foreground">{formatRupiah(detail.customerAmount)}</span>
					</div>
					<div class="flex justify-between py-1">
						<span class="text-muted-foreground">BIAYA ADMIN</span>
						<span class="text-secondary-foreground">{formatRupiah(detail.adminFeeCharged)}</span>
					</div>
					<div class="flex justify-between border-t border-border/50 py-1 pt-1">
						<span class="text-muted-foreground">TOTAL VOLUME</span>
						<span class="font-bold text-foreground"
							>{formatRupiah(Number(detail.customerAmount) + Number(detail.adminFeeCharged))}</span
						>
					</div>
					<div class="my-1 flex justify-between border-t border-border/50 pt-2 font-semibold">
						<span class="text-muted-foreground">KOMISI BERSIH AGEN</span>
						<span class="text-primary">{formatRupiah(detail.agentCommission)}</span>
					</div>
				</div>

				<!-- Notes Section -->
				{#if detail.notes && detail.notes.trim() !== ''}
					<div class="space-y-2">
						<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Catatan / Keterangan</span
						>
						<div
							class="rounded-lg border border-border bg-background/50 p-3 text-sm whitespace-pre-wrap text-secondary-foreground"
						>
							{detail.notes}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<Dialog.Footer class="border-t border-border pt-4 sm:justify-end">
			<Button variant="outline" class="font-mono text-xs" onclick={() => (open = false)}
				>Tutup</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
