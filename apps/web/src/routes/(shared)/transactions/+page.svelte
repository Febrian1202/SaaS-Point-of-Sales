<script lang="ts">
	import { Receipt, Search, FileText } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { formatRupiah } from '$lib/utils/index';
	import { useSearchParams } from '$lib/hooks/useSearchParams.svelte';
	import type { TrxItem } from '$lib/types/ui';
	import { base } from '$app/paths';

	let { data } = $props();
	const user = $derived(data?.user);
	const { getParam, updateSearch } = useSearchParams();

	let searchQuery = $state(getParam('search', ''));
	let filterTimer: ReturnType<typeof setTimeout>;

	function handleSearch(e: Event) {
		const query = (e.target as HTMLInputElement).value;
		searchQuery = query;

		clearTimeout(filterTimer);
		filterTimer = setTimeout(() => {
			updateSearch(query);
		}, 300);
	}
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="animate-in space-y-6 duration-500 fade-in slide-in-from-bottom-3">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Riwayat Transaksi
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">Daftar transaksi yang Anda proses.</p>
		</div>
	</div>

	<Card.Root class="gap-0 overflow-hidden border-border bg-card pt-0 pb-0">
		<Card.Header
			class="flex flex-col items-start justify-between gap-4 border-b border-border bg-background/30 p-4 sm:flex-row sm:items-center"
		>
			<div class="relative w-full max-w-xs">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					class="w-full border-border bg-background pr-4 pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0"
					placeholder="Cari transaksi..."
					type="text"
					value={searchQuery}
					oninput={handleSearch}
				/>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			<Table.Root>
				<Table.Header class="border-b border-border bg-background/20">
					<Table.Row class="border-b border-border hover:bg-transparent">
						<Table.Head
							class="h-9 px-4 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
							>No. Trx</Table.Head
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
						{#each Array(10) as _, i (i)}
							<Table.Row class="border-b border-border/50">
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-24" /></Table.Cell>
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-32" /></Table.Cell>
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-24" /></Table.Cell>
								<Table.Cell class="px-4 py-3"><Skeleton class="h-4 w-16" /></Table.Cell>
								<Table.Cell class="px-4 py-3 text-center"
									><Skeleton class="mx-auto h-4 w-16" /></Table.Cell
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
									<Table.Cell class="px-4 py-3 font-mono text-xs text-foreground"
										>{trx.trxNumber}</Table.Cell
									>
									<Table.Cell class="px-4 py-3 text-sm text-foreground">
										{new Date(trx.createdAt).toLocaleString('id-ID', {
											dateStyle: 'medium',
											timeStyle: 'short'
										})}
									</Table.Cell>
									<Table.Cell class="px-4 py-3 font-mono text-xs font-semibold text-foreground">
										{formatRupiah(Number(trx.totalAmount))}
									</Table.Cell>
									<Table.Cell class="px-4 py-3 text-xs text-muted-foreground uppercase"
										>{trx.paymentMethod}</Table.Cell
									>
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
											href="{base}/transactions/{trx.id}"
										>
											<FileText class="mr-1.5 size-3" /> Detail
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						{:else}
							<Table.Row>
								<Table.Cell colspan={6} class="h-32 text-center text-muted-foreground">
									<Receipt class="mx-auto mb-2 size-8 opacity-20" />
									<p>Tidak ada transaksi ditemukan.</p>
								</Table.Cell>
							</Table.Row>
						{/if}
					{/await}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
