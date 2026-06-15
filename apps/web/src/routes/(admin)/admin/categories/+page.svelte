<script lang="ts">
	import { Search, Plus, RefreshCw, Edit2, Trash2 } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import { getCoreRowModel, type ColumnDef } from '@tanstack/table-core';
	import { renderSnippet } from '$lib/components/ui/data-table/render-helpers.js';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import CategoryDialog from '$lib/features/admin/category/CategoryDialog.svelte';
	import DeleteConfirmDialog from '$lib/features/shared/DeleteConfirmDialog.svelte';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';

	// Props data
	let { data } = $props();

	// State untuk bind input search
	let searchQuery = $state(page.url.searchParams.get('search') || '');

	type CategoryItem = {
		id: string;
		name: string;
		slug: string;
		createdAt?: Date | string | null;
	};

	// State untuk Dialog
	let showAdd = $state(false);
	let showDelete = $state(false);
	let targetId = $state('');
	let targetName = $state('');
	let editingCategory = $state<CategoryItem | null>(null);

	async function handleDelete() {
		const formData = new FormData();
		formData.append('id', targetId);

		const response = await fetch('?/delete', {
			method: 'POST',
			body: formData
		});

		const result = deserialize(await response.text());
		if (result.type === 'success') {
			toast.success(`Kategori ${targetName} berhasil dihapus.`);
			await invalidateAll();
		} else if (result.type === 'failure') {
			const data = result.data as { message?: string } | undefined;
			toast.error(data?.message || 'Gagal menghapus kategori.');
		} else if (result.type === 'error') {
			toast.error('Terjadi kesalahan pada sistem.');
		}
	}

	// Sync state saat URL berubah
	let prevUrl = $state(page.url.toString());
	$effect(() => {
		const currentUrl = page.url.toString();
		if (currentUrl !== prevUrl) {
			prevUrl = currentUrl;
			searchQuery = page.url.searchParams.get('search') || '';
		}
	});

	// Handler reset
	function resetFilters() {
		searchQuery = '';
		goto('?', { keepFocus: true, noScroll: true });
	}

	// Debounce pencarian
	$effect(() => {
		const query = searchQuery.trim();

		const timer = setTimeout(() => {
			const urlParams = new SvelteURLSearchParams(page.url.searchParams);

			const isQueryChanged = query !== page.url.searchParams.get('search');

			if (query) {
				urlParams.set('search', query);
			} else {
				urlParams.delete('search');
			}

			if (isQueryChanged) {
				goto(`?${urlParams.toString()}`, { keepFocus: true, noScroll: true });
			}
		}, 500);

		return () => clearTimeout(timer);
	});

	// Column Definition Setup
	const columns: ColumnDef<CategoryItem>[] = [
		{
			accessorKey: 'name',
			header: 'Kategori',
			cell: ({ row }) => {
				return renderSnippet(categoryNameSnippet, row.original);
			}
		},
		{
			accessorKey: 'slug',
			header: 'Slug',
			cell: ({ row }) => {
				return renderSnippet(categorySlugSnippet, row.original);
			}
		},
		{
			id: 'actions',
			header: 'Aksi',
			cell: ({ row }) => {
				return renderSnippet(categoryActionsSnippet, row.original);
			}
		}
	];

	// Reactive Table Instance using a derived options object to inject dynamically resolved data
	// Since categories come from streaming, we handle it in the markup
	function initTable(categories: CategoryItem[]) {
		return createSvelteTable({
			get data() {
				return categories;
			},
			columns,
			getCoreRowModel: getCoreRowModel()
		});
	}
</script>

<!-- Snippets for Custom Renderers -->
{#snippet categoryNameSnippet(category: CategoryItem)}
	<span class="block font-semibold text-foreground">{category.name}</span>
{/snippet}

{#snippet categorySlugSnippet(category: CategoryItem)}
	<span class="font-mono text-sm text-secondary-foreground">{category.slug}</span>
{/snippet}

{#snippet categoryActionsSnippet(category: CategoryItem)}
	<div class="flex items-center justify-center gap-1">
		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 text-secondary-foreground hover:text-primary"
			onclick={() => {
				editingCategory = category;
				showAdd = true;
			}}
		>
			<Edit2 class="h-4 w-4" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
			onclick={() => {
				targetId = category.id;
				targetName = category.name;
				showDelete = true;
			}}
		>
			<Trash2 class="h-4 w-4" />
		</Button>
	</div>
{/snippet}

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div
	class="flex-1 animate-in space-y-6 overflow-y-auto duration-500 fade-in slide-in-from-bottom-3"
>
	<!-- Header Section -->
	<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
		<div>
			<h3 class="font-tight text-3xl font-semibold tracking-tight text-foreground">
				Daftar Kategori
			</h3>
			<p class="text-sm text-secondary-foreground">
				Kelola kategori produk untuk mempermudah inventarisasi.
			</p>
		</div>
		<Button
			class="gap-2"
			onclick={() => {
				editingCategory = null;
				showAdd = true;
			}}
		>
			<Plus class="h-4 w-4" />
			<span class="font-mono text-sm">Tambah Kategori</span>
		</Button>
	</div>

	<!-- Filter Row -->
	<div
		class="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm"
	>
		<!-- Pencarian -->
		<div class="min-w-75 flex-2 space-y-1.5">
			<label for="search" class="font-mono text-xs text-secondary-foreground">Pencarian Cepat</label
			>
			<div class="relative">
				<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					id="search"
					bind:value={searchQuery}
					type="text"
					placeholder="Cari kategori..."
					class="pl-9 font-sans text-sm"
				/>
			</div>
		</div>

		<Button
			variant="outline"
			onclick={resetFilters}
			class="gap-2 border-border text-secondary-foreground"
		>
			<RefreshCw class="h-4 w-4" />
			<span class="font-mono text-xs">Reset Filter</span>
		</Button>
	</div>

	<!-- Data Table Container -->
	<div class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
		<Table.Root>
			<Table.Header>
				<Table.Row class="border-b border-border bg-background hover:bg-background">
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase"
						>Kategori</Table.Head
					>
					<Table.Head class="font-mono text-xs text-secondary-foreground uppercase">Slug</Table.Head
					>
					<Table.Head class="text-center font-mono text-xs text-secondary-foreground uppercase"
						>Aksi</Table.Head
					>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#await data.streamed.categories}
					{#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
						<Table.Row>
							<Table.Cell>
								<Skeleton class="h-5 w-40" />
							</Table.Cell>
							<Table.Cell>
								<Skeleton class="h-4 w-32" />
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center justify-center gap-1">
									<Skeleton class="h-8 w-8 rounded-md" />
									<Skeleton class="h-8 w-8 rounded-md" />
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				{:then categories}
					{@const resolvedCategories = categories || []}
					{#if resolvedCategories.length > 0}
						{@const table = initTable(resolvedCategories)}
						{#each table.getRowModel().rows as row, rowIdx (row.id)}
							<Table.Row
								class="group animate-in transition-colors fade-in slide-in-from-bottom-1 hover:bg-muted/50"
								style="animation-delay: {rowIdx * 40}ms; animation-fill-mode: both;"
							>
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell class={cell.column.id === 'actions' ? 'text-center' : ''}>
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/each}
							</Table.Row>
						{/each}
					{:else}
						<Table.Row>
							<Table.Cell colspan={3} class="h-24 text-center">
								<div
									class="flex flex-col items-center justify-center gap-2 text-secondary-foreground"
								>
									<p class="font-mono text-sm">Tidak ada kategori ditemukan.</p>
								</div>
							</Table.Cell>
						</Table.Row>
					{/if}
				{/await}
			</Table.Body>
		</Table.Root>
	</div>
</div>

<CategoryDialog bind:open={showAdd} category={editingCategory} />

<DeleteConfirmDialog bind:open={showDelete} itemName={targetName} onConfirm={handleDelete} />
