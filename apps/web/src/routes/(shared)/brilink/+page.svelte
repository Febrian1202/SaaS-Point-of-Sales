<script lang="ts">
	import { Landmark, Plus, WalletCards, TrendingUp, Receipt, FileText } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { formatRupiah } from '$lib/utils/index';
	import { useSearchParams } from '$lib/hooks/useSearchParams.svelte';
	import { BRILINK_TRX_TYPES } from '$lib/constants';
	import type { BrilinkTrxType } from '$lib/types/ui';
	import { toast } from 'svelte-sonner';
	import { deserialize } from '$app/forms';
	import { base } from '$app/paths';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	const user = $derived(data?.user);
	const { updateUrl } = useSearchParams();

	let dateFilter = $derived(data.dateFilter);
	let typeFilter = $derived(data.typeFilter || 'all');
	let filterTimer: ReturnType<typeof setTimeout>;

	function handleDateChange(e: Event) {
		const target = e.target as HTMLInputElement;
		dateFilter = target.value;
		clearTimeout(filterTimer);
		filterTimer = setTimeout(() => {
			updateUrl({ date: dateFilter, type: typeFilter });
		}, 300);
	}

	function handleTypeChange(val: string) {
		typeFilter = val;
		updateUrl({ date: dateFilter, type: val === 'all' ? undefined : val });
	}

	// Form Dialog State
	let formOpen = $state(false);
	let isSubmitting = $state(false);

	let trxType: BrilinkTrxType | '' = $state('');
	let customerAmountRaw = $state('');
	let adminFeeRaw = $state('');
	let agentCommissionRaw = $state('');
	let referenceNumber = $state('');
	let notes = $state('');

	const customerAmount = $derived(Number(customerAmountRaw.replace(/\D/g, '')) || 0);
	const adminFeeCharged = $derived(Number(adminFeeRaw.replace(/\D/g, '')) || 0);
	const agentCommission = $derived(Number(agentCommissionRaw.replace(/\D/g, '')) || 0);
	const canSubmit = $derived(
		trxType !== '' &&
			customerAmount > 0 &&
			agentCommission > 0 &&
			referenceNumber.length >= 3 &&
			!isSubmitting
	);

	function handleRupiahInput(e: Event, setter: (val: string) => void) {
		const target = e.target as HTMLInputElement;
		const raw = target.value.replace(/\D/g, '');
		setter(raw ? formatRupiah(Number(raw)) : '');
	}

	async function handleSubmitForm() {
		if (!canSubmit) return;
		isSubmitting = true;

		const payload = {
			trxType,
			customerAmount,
			adminFeeCharged,
			agentCommission,
			referenceNumber,
			notes: notes || undefined
		};

		const formData = new FormData();
		formData.append('body', JSON.stringify(payload));

		try {
			const response = await fetch('?/create', { method: 'POST', body: formData });
			const result = deserialize(await response.text());

			if (result.type === 'success') {
				toast.success('Transaksi BRI Link berhasil dicatat');
				formOpen = false;
				resetForm();
				await invalidateAll(); // Refresh data halaman
			} else {
				toast.error((result as any)?.message ?? 'Gagal mencatat transaksi');
			}
		} catch (e) {
			toast.error('Terjadi kesalahan sistem');
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		trxType = '';
		customerAmountRaw = '';
		adminFeeRaw = '';
		agentCommissionRaw = '';
		referenceNumber = '';
		notes = '';
	}
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-3">
	<!-- Header -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Layanan BRI Link
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Catat dan pantau transaksi agen BRI Link toko Anda.
			</p>
		</div>

		<Button
			class="h-11 rounded-md bg-primary font-tight text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
			onclick={() => (formOpen = true)}
		>
			<Plus class="mr-2 size-4" />
			CATAT TRANSAKSI
		</Button>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<!-- Komisi -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Total Komisi Agen</span
				>
				<Landmark class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				{#await data.streamed.summary}
					<Skeleton class="h-8 w-32" />
					<Skeleton class="mt-2 h-4 w-24" />
				{:then sum}
					<div class="font-tight text-2xl font-semibold text-foreground">
						{formatRupiah(sum?.grandTotalCommission || 0)}
					</div>
					<span class="mt-1 block font-mono text-[11px] text-muted-foreground">
						Keuntungan bersih toko
					</span>
				{/await}
			</Card.Content>
		</Card.Root>

		<!-- Volume -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Volume Transaksi</span
				>
				<WalletCards class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				{#await data.streamed.summary}
					<Skeleton class="h-8 w-32" />
					<Skeleton class="mt-2 h-4 w-24" />
				{:then sum}
					<div class="font-tight text-2xl font-semibold text-foreground">
						{formatRupiah(sum?.grandTotalVolume || 0)}
					</div>
					<span class="mt-1 block font-mono text-[11px] text-muted-foreground">
						Total mutasi dana
					</span>
				{/await}
			</Card.Content>
		</Card.Root>

		<!-- Jumlah Transaksi -->
		<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
					>Jumlah Transaksi</span
				>
				<TrendingUp class="size-5 text-primary" />
			</Card.Header>
			<Card.Content>
				{#await data.streamed.summary}
					<Skeleton class="h-8 w-32" />
					<Skeleton class="mt-2 h-4 w-24" />
				{:then sum}
					<div class="font-tight text-2xl font-semibold text-foreground">
						{sum?.grandTotalTransaction || 0} Trx
					</div>
					<span class="mt-1 block font-mono text-[11px] text-muted-foreground">
						Untuk tanggal terpilih
					</span>
				{/await}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Main Workspace -->
	<Card.Root class="gap-0 overflow-hidden border-border bg-card pt-0 pb-0">
		<Card.Header
			class="flex flex-col items-start justify-between gap-4 border-b border-border bg-background/30 p-4 sm:flex-row sm:items-center"
		>
			<div class="flex flex-wrap items-center gap-3">
				<!-- Date Filter -->
				<div class="relative w-40">
					<Input
						type="date"
						class="w-full border-border bg-background text-sm text-foreground focus-visible:border-primary"
						value={dateFilter}
						oninput={handleDateChange}
					/>
				</div>

				<!-- Type Filter -->
				<Select.Root type="single" value={typeFilter} onValueChange={handleTypeChange}>
					<Select.Trigger class="w-[180px] bg-background">
						{typeFilter === 'all'
							? 'Semua Tipe'
							: BRILINK_TRX_TYPES.find((t) => t.value === typeFilter)?.label || 'Pilih Tipe'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="all">Semua Tipe</Select.Item>
						{#each BRILINK_TRX_TYPES as type, i (i)}
							<Select.Item value={type.value}>{type.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			<Table.Root>
				<Table.Header class="border-b border-border bg-background/20">
					<Table.Row class="border-b border-border hover:bg-transparent">
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Waktu</Table.Head
						>
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>No. Ref</Table.Head
						>
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Jenis</Table.Head
						>
						<Table.Head
							class="h-9 px-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Nominal</Table.Head
						>
						<Table.Head
							class="h-9 px-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Komisi</Table.Head
						>
						<Table.Head
							class="h-9 px-4 text-center font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Status</Table.Head
						>
						<Table.Head
							class="h-9 px-4 text-right font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>Aksi</Table.Head
						>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#await data.streamed.transactions}
						{#each Array(5) as _, i (i)}
							<Table.Row class="border-b border-border/50">
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-16" /></Table.Cell>
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-24" /></Table.Cell>
								<Table.Cell class="px-4 py-3"><Skeleton class="h-5 w-20 rounded-full" /></Table.Cell
								>
								<Table.Cell class="px-4 py-3 text-right"
									><Skeleton class="ml-auto h-4 w-24" /></Table.Cell
								>
								<Table.Cell class="px-4 py-3 text-right"
									><Skeleton class="ml-auto h-4 w-16 text-primary" /></Table.Cell
								>
								<Table.Cell class="px-4 py-3 text-center"
									><Skeleton class="mx-auto h-5 w-16 rounded-full" /></Table.Cell
								>
								<Table.Cell class="px-4 py-3 text-right"
									><Skeleton class="ml-auto h-8 w-20" /></Table.Cell
								>
							</Table.Row>
						{/each}
					{:then res}
						{@const trxList = (res?.data || []).filter(
							(t: any) => !user?.name || t.cashierName === user.name
						)}
						{#if trxList.length > 0}
							{#each trxList as trx (trx.id)}
								<Table.Row class="border-b border-border/50 transition-colors hover:bg-border/10">
									<Table.Cell class="px-4 py-3 text-xs text-foreground">
										{new Date(trx.createdAt || Date.now()).toLocaleTimeString('id-ID', {
											hour: '2-digit',
											minute: '2-digit'
										})}
									</Table.Cell>
									<Table.Cell class="px-4 py-3 font-mono text-xs text-muted-foreground"
										>{trx.referenceNumber}</Table.Cell
									>
									<Table.Cell class="px-4 py-3">
										<Badge
											variant="secondary"
											class="font-mono text-[10px] tracking-tight uppercase"
										>
											{BRILINK_TRX_TYPES.find((t) => t.value === trx.trxType)?.label || trx.trxType}
										</Badge>
									</Table.Cell>
									<Table.Cell
										class="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground"
									>
										{formatRupiah(Number(trx.customerAmount))}
									</Table.Cell>
									<Table.Cell class="px-4 py-3 text-right font-mono text-xs font-bold text-primary">
										+{formatRupiah(Number(trx.agentCommission))}
									</Table.Cell>
									<Table.Cell class="px-4 py-3 text-center">
										<Badge
											class="rounded-sm border-transparent {trx.status === 'success'
												? 'bg-primary/10 text-primary'
												: 'bg-destructive/10 text-destructive'} px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase select-none"
										>
											{trx.status}
										</Badge>
									</Table.Cell>
									<Table.Cell class="px-4 py-3 text-right">
										<Button
											variant="outline"
											size="sm"
											class="h-8 border-border text-xs"
											href="{base}/brilink/{trx.id}"
										>
											<FileText class="mr-1.5 size-3" /> Detail
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colspan={7} class="h-32 text-center text-muted-foreground">
									<Receipt class="mx-auto mb-2 size-8 opacity-20" />
									<p>Tidak ada transaksi BRI Link ditemukan.</p>
								</Table.Cell>
							</Table.Row>
						{/if}
					{/await}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>

<!-- Modal Pencatatan Transaksi Baru -->
<Dialog.Root bind:open={formOpen} onOpenChange={(v) => !v && resetForm()}>
	<Dialog.Content class="max-w-md border-border bg-card p-6">
		<Dialog.Header class="mb-4">
			<Dialog.Title class="font-tight text-xl font-bold">Catat Transaksi BRI Link</Dialog.Title>
			<Dialog.Description class="text-xs">
				Pastikan uang fisik sudah diterima/diberikan sebelum mencatat ke sistem.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<div>
				<label
					for="trxType"
					class="mb-1.5 block font-mono text-[10px] text-muted-foreground uppercase"
					>Jenis Transaksi *</label
				>
				<Select.Root type="single" bind:value={trxType as string}>
					<Select.Trigger id="trxType" class="w-full border-border bg-background">
						{BRILINK_TRX_TYPES.find((t) => t.value === trxType)?.label || 'Pilih Jenis Transaksi'}
					</Select.Trigger>
					<Select.Content>
						{#each BRILINK_TRX_TYPES as type, i (i)}
							<Select.Item value={type.value}>{type.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div>
				<label
					for="referenceNumber"
					class="mb-1.5 block font-mono text-[10px] text-muted-foreground uppercase"
					>No. Referensi / Struk EDC *</label
				>
				<Input
					id="referenceNumber"
					class="border-border bg-background font-mono text-sm uppercase placeholder:text-muted-foreground/40"
					placeholder="Contoh: 881029310"
					bind:value={referenceNumber}
					maxlength={20}
				/>
				<p class="mt-1 text-[10px] text-muted-foreground">Hanya angka & huruf (min. 3 karakter)</p>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="col-span-2">
					<label
						for="amount"
						class="mb-1.5 block font-mono text-[10px] text-muted-foreground uppercase"
						>Nominal Transaksi (Nasabah) *</label
					>
					<Input
						id="amount"
						class="border-border bg-background font-mono text-sm"
						placeholder="Rp 0"
						value={customerAmountRaw}
						oninput={(e) => handleRupiahInput(e, (v) => (customerAmountRaw = v))}
					/>
				</div>

				<div>
					<label
						for="adminFee"
						class="mb-1.5 block font-mono text-[10px] text-muted-foreground uppercase"
						>Biaya Admin EDC</label
					>
					<Input
						id="adminFee"
						class="border-border bg-background font-mono text-sm"
						placeholder="Rp 0"
						value={adminFeeRaw}
						oninput={(e) => handleRupiahInput(e, (v) => (adminFeeRaw = v))}
					/>
				</div>

				<div>
					<label
						for="shopFee"
						class="mb-1.5 block font-mono text-[10px] font-bold text-primary uppercase"
						>Komisi Toko (Untung) *</label
					>
					<Input
						id="shopFee"
						class="border-primary/20 bg-primary/5 font-mono text-sm font-bold text-primary focus-visible:ring-primary"
						placeholder="Rp 0"
						value={agentCommissionRaw}
						oninput={(e) => handleRupiahInput(e, (v) => (agentCommissionRaw = v))}
					/>
				</div>
			</div>

			<div>
				<label
					for="notes"
					class="mb-1.5 block font-mono text-[10px] text-muted-foreground uppercase"
					>Catatan Tambahan (Opsional)</label
				>
				<Input
					id="notes"
					class="border-border bg-background text-sm placeholder:text-muted-foreground/40"
					placeholder="Nama nasabah atau keterangan lain..."
					bind:value={notes}
				/>
			</div>
		</div>

		<Dialog.Footer class="mt-6 border-t border-border pt-4">
			<Button variant="ghost" class="text-muted-foreground" onclick={() => (formOpen = false)}
				>Batal</Button
			>
			<Button
				class="bg-primary font-bold text-primary-foreground"
				disabled={!canSubmit}
				onclick={handleSubmitForm}
			>
				{isSubmitting ? 'MENYIMPAN...' : 'SIMPAN TRANSAKSI'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
