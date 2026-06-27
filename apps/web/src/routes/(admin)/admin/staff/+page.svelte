<script lang="ts">
	import { Plus, Pencil, ShieldOff, Search, Users, UserCheck, UserX } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import StaffDialog from '$lib/features/admin/staff/StaffDialog.svelte';
	import DeleteConfirmDialog from '$lib/features/shared/DeleteConfirmDialog.svelte';
	import type { StaffItem } from '$lib/types/ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State untuk Dialog
	let showAdd = $state(false);
	let showDelete = $state(false);
	let targetId = $state('');
	let targetName = $state('');
	let editingStaff = $state<StaffItem | null>(null);

	// State untuk pencarian
	let searchQuery = $state('');

	// Handler untuk hapus/nonaktifkan
	async function handleDelete() {
		const formData = new FormData();
		formData.append('id', targetId);

		const response = await fetch('?/delete', {
			method: 'POST',
			body: formData
		});

		const result = deserialize(await response.text());
		if (result.type === 'success') {
			toast.success(`Akses staf ${targetName} berhasil dinonaktifkan.`);
			await invalidateAll();
		} else if (result.type === 'failure') {
			const data = result.data as { message?: string } | undefined;
			toast.error(data?.message || 'Gagal menonaktifkan staf.');
		} else if (result.type === 'error') {
			toast.error('Terjadi kesalahan pada sistem.');
		}
	}

	// Helper function untuk initial nama
	function getInitials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase();
	}
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div
	class="flex-1 animate-in space-y-6 overflow-y-auto duration-500 fade-in slide-in-from-bottom-3"
>
	<!-- Welcome Header & CTA -->
	<section class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
		<div>
			<h3 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Daftar Akun Kasir
			</h3>
			<p class="mt-1 max-w-xl text-sm text-secondary-foreground">
				Kelola akses dan akun kasir toko Anda untuk memastikan operasional berjalan lancar dan aman.
			</p>
		</div>
		<Button
			class="gap-2 bg-primary font-mono text-sm font-bold text-primary-foreground hover:brightness-110"
			onclick={() => {
				editingStaff = null;
				showAdd = true;
			}}
		>
			<Plus class="h-4 w-4" />
			Tambah Kasir
		</Button>
	</section>

	{#await data.streamed.staffs}
		<!-- Skeleton untuk Stats Grid -->
		<section class="grid grid-cols-1 gap-4 md:grid-cols-3">
			{#each Array.from({ length: 3 }, (_, i) => i) as i (i)}
				<div class="rounded-xl border border-border bg-card p-4">
					<Skeleton class="mb-2 h-4 w-24" />
					<Skeleton class="h-8 w-16" />
				</div>
			{/each}
		</section>
	{:then staffs}
		{@const allStaffs = staffs || []}
		<!-- Stats Grid (Bento Style) -->
		<section class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
						>Total Staf</span
					>
					<Users class="size-5 text-primary" />
				</Card.Header>
				<Card.Content>
					<div class="font-tight text-2xl font-semibold text-foreground">
						{allStaffs.length}
					</div>
					<!-- <span class="mt-1 block font-mono text-[11px] text-muted-foreground">+2 bulan ini</span> -->
				</Card.Content>
			</Card.Root>

			<!-- Catatan: Karena backend hanya mengembalikan kasir yang aktif (berdasarkan users.isActive === true di service getCashier), maka Active = Total -->
			<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
						>Kasir Aktif</span
					>
					<UserCheck class="size-5 text-primary" />
				</Card.Header>
				<Card.Content>
					<div class="font-tight text-2xl font-semibold text-foreground">
						{allStaffs.length}
					</div>
					<div class="mt-1 flex items-center gap-1.5 text-primary">
						<div class="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
						<span class="font-mono text-[11px]">Online</span>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="group border-border bg-card transition-colors hover:bg-border/20">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<span class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
						>Akses Dibatasi</span
					>
					<UserX class="size-5 text-destructive" />
				</Card.Header>
				<Card.Content>
					<div class="font-tight text-2xl font-semibold text-foreground">0</div>
					<span class="mt-1 block font-mono text-[11px] text-destructive">Nonaktif</span>
				</Card.Content>
			</Card.Root>
		</section>

		<!-- Pencarian Cepat -->
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<label for="search" class="font-mono text-xs text-secondary-foreground">Pencarian Staf</label>
			<div class="relative">
				<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					id="search"
					bind:value={searchQuery}
					type="text"
					placeholder="Cari nama atau email..."
					class="pl-9 font-sans text-sm"
				/>
			</div>
		</div>

		<!-- Data Table Section -->
		<section class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
			<Table.Root>
				<Table.Header>
					<Table.Row class="border-b border-border bg-background hover:bg-background">
						<Table.Head class="px-4 py-3 font-mono text-xs text-secondary-foreground uppercase"
							>Nama</Table.Head
						>
						<Table.Head class="px-4 py-3 font-mono text-xs text-secondary-foreground uppercase"
							>Email</Table.Head
						>
						<Table.Head class="px-4 py-3 font-mono text-xs text-secondary-foreground uppercase"
							>Role</Table.Head
						>
						<Table.Head class="px-4 py-3 font-mono text-xs text-secondary-foreground uppercase"
							>Status</Table.Head
						>
						<Table.Head
							class="px-4 py-3 text-right font-mono text-xs text-secondary-foreground uppercase"
							>Aksi</Table.Head
						>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{@const filteredStaffs = allStaffs.filter(
						(s) =>
							s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
							s.email.toLowerCase().includes(searchQuery.toLowerCase())
					)}
					{#if filteredStaffs.length === 0}
						<Table.Row>
							<Table.Cell colspan={5} class="h-24 text-center">
								<p class="font-mono text-sm text-secondary-foreground">Tidak ada staf ditemukan.</p>
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each filteredStaffs as st (st.id)}
							<Table.Row class="group border-b border-border transition-colors hover:bg-muted/50">
								<Table.Cell class="px-4 py-3">
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-border font-bold text-primary"
										>
											{getInitials(st.name)}
										</div>
										<span class="font-semibold text-foreground">{st.name}</span>
									</div>
								</Table.Cell>
								<Table.Cell class="px-4 py-3 font-mono text-sm text-secondary-foreground">
									{st.email}
								</Table.Cell>
								<Table.Cell class="px-4 py-3">
									<Badge
										variant="outline"
										class="border-border bg-background font-mono text-[10px] text-secondary-foreground uppercase"
									>
										{st.role}
									</Badge>
								</Table.Cell>
								<Table.Cell class="px-4 py-3">
									<Badge
										class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold text-primary uppercase select-none"
									>
										<span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
										Aktif
									</Badge>
								</Table.Cell>
								<Table.Cell class="px-4 py-3 text-right">
									<div
										class="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
									>
										<Button
											variant="ghost"
											size="icon"
											class="h-8 w-8 text-secondary-foreground hover:text-primary"
											title="Edit Staf"
											onclick={() => {
												editingStaff = st;
												showAdd = true;
											}}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="h-8 w-8 text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
											title="Hapus Staf"
											onclick={() => {
												targetId = st.id;
												targetName = st.name;
												showDelete = true;
											}}
										>
											<ShieldOff class="h-4 w-4" />
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</section>
	{/await}
</div>

<StaffDialog bind:open={showAdd} staff={editingStaff} />

<!-- Gunakan title yang lebih sesuai untuk menonaktifkan akun -->
<DeleteConfirmDialog bind:open={showDelete} itemName={targetName} onConfirm={handleDelete} />
