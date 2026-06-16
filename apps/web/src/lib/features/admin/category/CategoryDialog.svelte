<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { categorySchema } from '$lib/schemas';
	import { slide } from 'svelte/transition';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';

	import type { CategoryItem } from '$lib/types';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		category?: CategoryItem | null;
	};

	let { open = $bindable(false), onOpenChange, category = null }: Props = $props();

	// State form input
	let name = $state('');
	let loading = $state(false);

	const isEdit = $derived(!!category);
	const formAction = $derived(isEdit ? '?/update' : '?/create');

	// State error reaktif
	let errors = $state<{
		name?: string;
	}>({});

	function resetForm() {
		name = '';
		errors = {};
	}

	function handleOpenChange(val: boolean) {
		if (!val) resetForm();
		onOpenChange?.(val);
	}

	// Pre-fill values when category changes
	$effect(() => {
		if (category) {
			name = category.name || '';
		} else {
			resetForm();
		}
	});

	// Fungsi validasi real-time
	function validateField() {
		const result = categorySchema.safeParse({ name });
		if (result.success) {
			errors.name = undefined;
		} else {
			const fieldErrors = result.error.flatten().fieldErrors;
			errors.name = fieldErrors.name?.[0];
		}
	}

	// Submit handler yang terintegrasi dengan SvelteKit progressive enhancement
	const handleEnhance: SubmitFunction = ({ cancel }) => {
		const result = categorySchema.safeParse({ name });

		if (!result.success) {
			cancel(); // Batalkan pengiriman ke server
			const fieldErrors = result.error.flatten().fieldErrors;
			errors = {
				name: fieldErrors.name?.[0]
			};
			return;
		}

		loading = true;
		return async ({ result, update }) => {
			loading = false;
			if (result.type === 'success' || result.type === 'redirect') {
				toast.success(
					isEdit ? 'Kategori berhasil diperbarui!' : 'Kategori baru berhasil ditambahkan!'
				);
				open = false;
				resetForm();
				update(); // Reset form DOM
			} else {
				if (result.type === 'failure') {
					const data = result.data as { message?: string } | undefined;
					if (data?.message) {
						toast.error(data.message);
					} else {
						toast.error(isEdit ? 'Gagal memperbarui kategori.' : 'Gagal menambahkan kategori.');
					}
				} else if (result.type === 'error') {
					toast.error('Terjadi kesalahan pada sistem.');
				}
				update({ reset: false }); // Biarkan isian pengguna jika gagal validasi
			}
		};
	};
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content
		class="max-w-md gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-2xl"
		showCloseButton={false}
	>
		<!-- Header -->
		<Dialog.Header
			class="flex flex-row items-center justify-between border-b border-border bg-background/40 px-5 py-4"
		>
			<Dialog.Title class="font-tight text-base font-semibold text-foreground">
				{isEdit ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
			</Dialog.Title>
			<Dialog.Close>
				{#snippet child({ props })}
					<button
						{...props}
						class="text-muted-foreground transition-colors hover:text-foreground"
						aria-label="Tutup"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M18 6 6 18" /><path d="m6 6 12 12" />
						</svg>
					</button>
				{/snippet}
			</Dialog.Close>
		</Dialog.Header>

		<!-- Form -->
		<form
			method="POST"
			action={formAction}
			class="space-y-4 p-5"
			use:enhance={handleEnhance}
			novalidate
		>
			{#if isEdit}
				<input type="hidden" name="id" value={category?.id} />
			{/if}
			<!-- Nama Kategori -->
			<div class="group space-y-1.5">
				<Label
					class="font-mono text-[10px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.name
						? 'text-destructive'
						: 'text-muted-foreground'}"
					for="category-name"
				>
					Nama Kategori
				</Label>
				<Input
					id="category-name"
					name="name"
					type="text"
					bind:value={name}
					oninput={validateField}
					placeholder="Contoh: Minuman, Makanan Ringan"
					class="border-border bg-background font-sans focus:border-primary {errors.name
						? 'border-destructive focus:border-destructive'
						: ''}"
					required
				/>
				{#if errors.name}
					<p transition:slide={{ duration: 200 }} class="mt-1 text-xs text-destructive">
						{errors.name}
					</p>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex gap-3 pt-2">
				<Dialog.Close>
					{#snippet child({ props })}
						<Button
							{...props}
							type="button"
							variant="outline"
							class="flex-1 border-border font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
							disabled={loading}
						>
							Batal
						</Button>
					{/snippet}
				</Dialog.Close>
				<Button
					type="submit"
					class="flex-1 bg-primary font-mono text-xs font-bold text-primary-foreground hover:brightness-110 active:scale-95"
					disabled={loading}
				>
					{loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Kategori'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
