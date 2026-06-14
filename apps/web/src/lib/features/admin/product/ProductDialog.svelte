<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { productSchema } from '$lib/schemas';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';

	type ProductItem = {
		id: string;
		name: string;
		barcode?: string | null;
		sellingPrice: string | number;
		stockQty?: number | null;
		unit?: string | null;
		category?: {
			name: string;
		} | null;
	};

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		categories?: Array<{ id: string; name: string }>;
		product?: ProductItem | null;
	};

	let { open = $bindable(false), onOpenChange, categories = [], product = null }: Props = $props();

	// State form input
	let name = $state('');
	let barcode = $state('');
	let categoryId = $state('');
	let price: string | number = $state('');
	let stock: number | string = $state(0);
	let unit = $state('pcs');
	let loading = $state(false);

	const isEdit = $derived(!!product);
	const formAction = $derived(isEdit ? '?/update' : '?/create');

	// State error reaktif
	let errors = $state<{
		name?: string;
		barcode?: string;
		categoryId?: string;
		price?: string;
		stock?: string;
		unit?: string;
	}>({});

	function resetForm() {
		name = '';
		barcode = '';
		categoryId = '';
		price = '';
		stock = 0;
		unit = 'pcs';
		errors = {};
	}

	function handleOpenChange(val: boolean) {
		if (!val) resetForm();
		onOpenChange?.(val);
	}

	// Pre-fill values when product changes
	$effect(() => {
		if (product) {
			name = product.name || '';
			barcode = product.barcode || '';
			// Cari categoryId berdasarkan nama kategori di product
			const catName = product.category?.name;
			if (catName) {
				categoryId = categories.find((c) => c.name === catName)?.id || '';
			} else {
				categoryId = '';
			}
			price = product.sellingPrice ? String(product.sellingPrice) : '';
			stock = product.stockQty || 0;
			unit = product.unit || 'pcs';
		} else {
			resetForm();
		}
	});

	// Fungsi validasi real-time per kolom
	function validateField(field: 'name' | 'barcode' | 'categoryId' | 'price' | 'stock' | 'unit') {
		const result = productSchema.safeParse({
			name,
			barcode,
			categoryId,
			sellingPrice: price,
			stockQty: stock,
			unit
		});

		if (result.success) {
			errors[field] = undefined;
		} else {
			const fieldErrors = result.error.flatten().fieldErrors;
			if (field === 'price') {
				errors.price = fieldErrors.sellingPrice?.[0];
			} else if (field === 'stock') {
				errors.stock = fieldErrors.stockQty?.[0];
			} else {
				errors[field] = fieldErrors[field]?.[0];
			}
		}
	}

	// Submit handler yang terintegrasi dengan SvelteKit progressive enhancement
	const handleEnhance: SubmitFunction = ({ cancel }) => {
		const result = productSchema.safeParse({
			name,
			barcode,
			categoryId,
			sellingPrice: price,
			stockQty: stock,
			unit
		});

		if (!result.success) {
			cancel(); // Batalkan pengiriman ke server
			const fieldErrors = result.error.flatten().fieldErrors;
			errors = {
				name: fieldErrors.name?.[0],
				barcode: fieldErrors.barcode?.[0],
				categoryId: fieldErrors.categoryId?.[0],
				price: fieldErrors.sellingPrice?.[0],
				stock: fieldErrors.stockQty?.[0],
				unit: fieldErrors.unit?.[0]
			};
			return;
		}

		loading = true;
		return async ({ result, update }) => {
			loading = false;
			if (result.type === 'success' || result.type === 'redirect') {
				toast.success(isEdit ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!');
				open = false;
				resetForm();
				update(); // Reset form DOM
			} else {
				if (result.type === 'failure') {
					const data = result.data as { message?: string } | undefined;
					if (data?.message) {
						toast.error(data.message);
					} else {
						toast.error(isEdit ? 'Gagal memperbarui produk.' : 'Gagal menambahkan produk.');
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
		class="max-w-lg gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-2xl"
		showCloseButton={false}
	>
		<!-- Header -->
		<Dialog.Header
			class="flex flex-row items-center justify-between border-b border-border bg-background/40 px-5 py-4"
		>
			<Dialog.Title class="font-tight text-base font-semibold text-foreground">
				{isEdit ? 'Ubah Produk' : 'Tambah Produk Baru'}
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
				<input type="hidden" name="id" value={product?.id} />
			{/if}
			<!-- Nama Produk -->
			<div class="group space-y-1.5">
				<Label
					class="font-mono text-[10px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.name
						? 'text-destructive'
						: 'text-muted-foreground'}"
					for="product-name"
				>
					Nama Produk
				</Label>
				<Input
					id="product-name"
					name="name"
					type="text"
					bind:value={name}
					oninput={() => validateField('name')}
					placeholder="Contoh: Kopi Susu Gula Aren"
					class="border-border bg-background font-sans focus:border-primary {errors.name
						? 'border-destructive focus:border-destructive'
						: ''}"
					required
				/>
				{#if errors.name}
					<p class="mt-1 text-xs text-destructive">{errors.name}</p>
				{/if}
			</div>

			<!-- Barcode + Kategori -->
			<div class="grid grid-cols-2 gap-4">
				<!-- Barcode -->
				<div class="group space-y-1.5">
					<Label
						class="font-mono text-[10px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.barcode
							? 'text-destructive'
							: 'text-muted-foreground'}"
						for="product-barcode"
					>
						Barcode
					</Label>
					<Input
						id="product-barcode"
						name="barcode"
						type="text"
						bind:value={barcode}
						oninput={() => validateField('barcode')}
						placeholder="899..."
						class="border-border bg-background font-mono focus:border-primary {errors.barcode
							? 'border-destructive focus:border-destructive'
							: ''}"
					/>
					{#if errors.barcode}
						<p class="mt-1 text-xs text-destructive">{errors.barcode}</p>
					{/if}
				</div>

				<!-- Kategori -->
				<div class="group space-y-1.5">
					<Label
						class="font-mono text-[10px] tracking-wider uppercase {errors.categoryId
							? 'text-destructive'
							: 'text-muted-foreground'}"
					>
						Kategori
					</Label>
					<input type="hidden" name="categoryId" value={categoryId} />
					<Select.Root
						type="single"
						bind:value={categoryId}
						onValueChange={() => validateField('categoryId')}
					>
						<Select.Trigger
							class="flex h-9 w-full min-w-0 items-center justify-between border-border bg-background font-mono text-sm focus:border-primary focus-visible:ring-0 {errors.categoryId
								? 'border-destructive focus:border-destructive'
								: ''}"
						>
							<span class="flex-1 truncate pr-2 text-left">
								{categories.find((c) => c.id === categoryId)?.name || 'Pilih Kategori'}
							</span>
						</Select.Trigger>
						<Select.Content>
							{#each categories as cat (cat.id)}
								<Select.Item value={cat.id} label={cat.name} />
							{/each}
						</Select.Content>
					</Select.Root>
					{#if errors.categoryId}
						<p class="mt-1 text-xs text-destructive">{errors.categoryId}</p>
					{/if}
				</div>
			</div>

			<!-- Harga + Satuan + Stok -->
			<div class="grid grid-cols-3 gap-4">
				<!-- Harga -->
				<div class="group space-y-1.5">
					<Label
						class="font-mono text-[10px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.price
							? 'text-destructive'
							: 'text-muted-foreground'}"
						for="product-price"
					>
						Harga (Rp)
					</Label>
					<Input
						id="product-price"
						name="price"
						type="number"
						bind:value={price}
						oninput={() => validateField('price')}
						placeholder="0"
						min="0"
						class="[appearance:textfield] border-border bg-background font-mono focus:border-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none {errors.price
							? 'border-destructive focus:border-destructive'
							: ''}"
					/>
					{#if errors.price}
						<p class="mt-1 text-xs text-destructive">{errors.price}</p>
					{/if}
				</div>

				<!-- Satuan / Unit -->
				<div class="group space-y-1.5">
					<Label
						class="font-mono text-[10px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.unit
							? 'text-destructive'
							: 'text-muted-foreground'}"
						for="product-unit"
					>
						Unit/Satuan
					</Label>
					<Input
						id="product-unit"
						name="unit"
						type="text"
						bind:value={unit}
						oninput={() => validateField('unit')}
						placeholder="pcs, box..."
						class="border-border bg-background font-sans focus:border-primary {errors.unit
							? 'border-destructive focus:border-destructive'
							: ''}"
						required
					/>
					{#if errors.unit}
						<p class="mt-1 text-xs text-destructive">{errors.unit}</p>
					{/if}
				</div>

				<!-- Stok Awal -->
				<div class="group space-y-1.5">
					<Label
						class="font-mono text-[10px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.stock
							? 'text-destructive'
							: 'text-muted-foreground'}"
						for="product-stock"
					>
						Stok Awal
					</Label>
					<Input
						id="product-stock"
						name="stock"
						type="number"
						bind:value={stock}
						oninput={() => validateField('stock')}
						placeholder="0"
						min="0"
						class="[appearance:textfield] border-border bg-background font-mono focus:border-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none {errors.stock
							? 'border-destructive focus:border-destructive'
							: ''}"
					/>
					{#if errors.stock}
						<p class="mt-1 text-xs text-destructive">{errors.stock}</p>
					{/if}
				</div>
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
					{loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
