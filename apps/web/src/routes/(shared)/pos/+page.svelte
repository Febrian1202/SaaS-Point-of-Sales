<script lang="ts">
	import { Search, ShoppingCart, Minus, Plus, Trash2, Receipt, CheckCircle2 } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { formatRupiah } from '$lib/utils/index';
	import type { CartItem, PaymentMethod, CategoryItem } from '$lib/types/ui';
	import { PAYMENT_METHODS } from '$lib/constants';
	import { toast } from 'svelte-sonner';
	import { deserialize } from '$app/forms';
	import PrinterStatus from '$lib/components/printer/PrinterStatus.svelte';
	import SerialPrintButton from '$lib/components/printer/SerialPrintButton.svelte';

	let { data } = $props();

	let cart: CartItem[] = $state([]);
	let amountPaidText = $state('');
	let paymentMethod: PaymentMethod = $state('cash');
	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let receiptData = $state<{
		trxNumber: string;
		totalAmount: number;
		changeAmount: number;
		items: CartItem[];
		amountPaid: number;
		paymentMethod: PaymentMethod;
		createdAt: Date;
	} | null>(null);
	let isSubmitting = $state(false);
	let receiptModalOpen = $state(false);

	let currentPage = $derived(1);
	const itemsPerPage = 10;

	const amountPaid = $derived(Number(amountPaidText.replace(/\D/g, '')) || 0);

	const cartTotal = $derived(cart.reduce((sum, item) => sum + item.subtotal, 0));
	const cartItemCount = $derived(cart.reduce((sum, item) => sum + item.qty, 0));
	const changeAmount = $derived(amountPaid - cartTotal);
	const canCheckout = $derived(cart.length > 0 && amountPaid >= cartTotal && !isSubmitting);

	// Filter produk berdasarkan search & kategori
	const filteredProducts = $derived(
		(data.products as import('$lib/types/ui').ProductItem[]).filter((p) => {
			const matchSearch =
				searchQuery === '' ||
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.barcode?.includes(searchQuery);
			const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
			return matchSearch && matchCategory;
		})
	);

	const totalPages = $derived(Math.ceil(filteredProducts.length / itemsPerPage));

	const paginatedProducts = $derived(
		filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	$effect(() => {
		// Reset halaman ke 1 saat pencarian atau filter kategori berubah
		// const s = searchQuery;
		// const c = selectedCategory;
		currentPage = 1;
	});

	$effect(() => {
		// Otomatis masukkan ke keranjang jika scan barcode spesifik persis 1 produk
		if (searchQuery !== '' && filteredProducts.length === 1) {
			const product = filteredProducts[0];
			if (product.barcode === searchQuery) {
				addToCart(product);
				searchQuery = '';
			}
		}
	});

	function addToCart(product: import('$lib/types/ui').ProductItem) {
		if (product.stock <= 0) {
			toast.error('Stok produk habis');
			return;
		}

		const existing = cart.find((item) => item.productId === product.id);
		if (existing) {
			if (existing.qty >= product.stock) {
				toast.error('Maksimal stok tercapai');
				return;
			}
			existing.qty += 1;
			existing.subtotal = existing.qty * existing.unitPrice;
			cart = [...cart];
		} else {
			cart = [
				...cart,
				{
					productId: product.id,
					name: product.name,
					barcode: product.barcode,
					unit: product.unit,
					unitPrice: Number(product.price),
					qty: 1,
					subtotal: Number(product.price)
				}
			];
		}
	}

	function updateQty(productId: string, delta: number) {
		const idx = cart.findIndex((i) => i.productId === productId);
		if (idx === -1) return;

		const item = cart[idx];
		const product = (data.products as import('$lib/types/ui').ProductItem[]).find(
			(p) => p.id === productId
		);

		if (!product) return;

		const newQty = item.qty + delta;
		if (newQty <= 0) {
			cart = cart.filter((i) => i.productId !== productId);
		} else if (newQty > (product.stock || 0)) {
			toast.error('Maksimal stok tercapai');
		} else {
			item.qty = newQty;
			item.subtotal = item.qty * item.unitPrice;
			cart = [...cart];
		}
	}

	function handleAmountPaidInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const raw = target.value.replace(/\D/g, '');
		amountPaidText = raw ? formatRupiah(Number(raw)) : '';
	}

	async function handleCheckout() {
		if (!canCheckout) return;
		isSubmitting = true;

		const payload = {
			items: cart.map((i) => ({
				productId: i.productId,
				qty: i.qty,
				unitPrice: i.unitPrice
			})),
			paymentMethod,
			amountPaid
		};

		const formData = new FormData();
		formData.append('body', JSON.stringify(payload));

		try {
			const response = await fetch('?/checkout', { method: 'POST', body: formData });
			const result = deserialize(await response.text());

			if (result.type === 'success' && result.data) {
				toast.success('Transaksi berhasil');
				const actionData = (result.data as { data: unknown }).data;
				const typedData = actionData as {
					trxNumber: string;
					totalAmount: number;
					changeAmount: number;
				};
				receiptData = {
					...typedData,
					items: [...cart],
					amountPaid: amountPaid,
					paymentMethod: paymentMethod,
					createdAt: new Date()
				};
				receiptModalOpen = true;
			} else {
				const errorData = (result as { data?: { message?: string } }).data;
				toast.error(errorData?.message ?? 'Gagal memproses transaksi');
			}
		} catch (e) {
			console.error(e);
			toast.error('Terjadi kesalahan sistem');
		} finally {
			isSubmitting = false;
		}
	}

	function resetCart() {
		cart = [];
		amountPaidText = '';
		paymentMethod = 'cash';
		receiptData = null;
		receiptModalOpen = false;
	}
</script>

<svelte:head>
	<title>Kasir (POS) | Transa</title>
</svelte:head>

<div class="flex h-[calc(100vh-6rem)] animate-in gap-6 duration-500 fade-in slide-in-from-bottom-3">
	<!-- Area Kiri: Katalog Produk (60%) -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Header Kiri: Search & Filter -->
		<div class="mb-4 flex items-center gap-3">
			<div class="relative flex-1">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					class="w-full border-border bg-card pr-4 pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0"
					placeholder="Cari nama produk atau scan barcode..."
					bind:value={searchQuery}
				/>
			</div>
			<Select.Root type="single" bind:value={selectedCategory}>
				<Select.Trigger class="w-45 bg-card">
					{selectedCategory === 'all'
						? 'Semua Kategori'
						: data.categories.find((c: CategoryItem) => c.id === selectedCategory)?.name ||
							'Semua Kategori'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all">Semua Kategori</Select.Item>
					{#each data.categories as cat (cat.id)}
						<Select.Item value={cat.id}>{cat.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<!-- Grid Produk -->
		<div class="flex-1 overflow-y-auto rounded-lg border border-border bg-background p-4">
			{#if filteredProducts.length === 0}
				<div class="flex h-full flex-col items-center justify-center text-muted-foreground">
					<ShoppingCart class="mb-2 size-12 opacity-20" />
					<p>Produk tidak ditemukan</p>
				</div>
			{:else}
				<div class="flex flex-col gap-3">
					{#each paginatedProducts as product (product.id)}
						<button
							class="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-border/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
							onclick={() => addToCart(product)}
							disabled={product.stock <= 0}
						>
							{#if product.stock <= 0}
								<div
									class="absolute top-0 left-0 z-10 flex h-full w-full items-center justify-center bg-background/80 font-mono text-xs font-bold text-destructive"
								>
									HABIS
								</div>
							{/if}

							<div class="flex flex-1 flex-col justify-center">
								<div class="font-tight text-sm font-semibold">{product.name}</div>
								<div class="mt-1 flex items-center gap-2">
									<span class="font-mono text-xs text-muted-foreground"
										>{product.barcode || '-'}</span
									>
								</div>
							</div>

							<div class="flex flex-col items-end justify-center pl-4 text-right">
								<div class="font-bold text-primary">
									{formatRupiah(Number(product.price))}
									{#if product.unit}
										<span class="text-[10px] font-normal text-muted-foreground"
											>/{product.unit}</span
										>
									{/if}
								</div>

								<div class="mt-1">
									{#if product.stock > 0 && product.stock <= 5}
										<Badge
											class="rounded-sm border-transparent bg-yellow-500/20 px-1.5 py-0 text-[10px] font-bold text-yellow-500"
										>
											SISA {product.stock}
										</Badge>
									{:else if product.stock > 5}
										<span class="text-xs text-muted-foreground">Stok: {product.stock}</span>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>

				<!-- Pagination Controls -->
				{#if totalPages > 1}
					<div class="mt-6 flex items-center justify-between border-t border-border pt-4 pb-2">
						<span class="text-xs text-muted-foreground">
							Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(
								currentPage * itemsPerPage,
								filteredProducts.length
							)} dari {filteredProducts.length} produk
						</span>
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage === 1}
								onclick={() => (currentPage -= 1)}
								class="h-8 border-border bg-card text-xs hover:bg-border/50"
							>
								Sebelumnya
							</Button>
							<span class="mx-2 font-mono text-xs font-medium">
								{currentPage} / {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage === totalPages}
								onclick={() => (currentPage += 1)}
								class="h-8 border-border bg-card text-xs hover:bg-border/50"
							>
								Selanjutnya
							</Button>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Area Kanan: Keranjang (40%) -->
	<Card.Root class="flex w-96 flex-col overflow-hidden border-border bg-card">
		<Card.Header class="border-b border-border bg-background/30 px-4 py-3">
			<div class="flex items-center justify-between">
				<Card.Title class="flex items-center gap-2 font-tight text-base">
					<ShoppingCart class="size-4 text-primary" />
					Keranjang
				</Card.Title>
				<div class="flex items-center gap-2">
					<PrinterStatus />
					<Badge variant="secondary" class="font-mono text-xs font-bold">{cartItemCount} item</Badge
					>
				</div>
			</div>
		</Card.Header>

		<Card.Content class="flex flex-1 flex-col overflow-hidden p-0">
			<!-- Cart Items List -->
			<div class="flex-1 space-y-3 overflow-y-auto p-4">
				{#if cart.length === 0}
					<div class="flex h-full flex-col items-center justify-center text-muted-foreground">
						<Receipt class="mb-2 size-8 opacity-20" />
						<p class="text-xs">Keranjang masih kosong</p>
					</div>
				{:else}
					{#each cart as item (item.productId)}
						<div
							class="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
						>
							<div class="flex flex-1 flex-col overflow-hidden pr-2">
								<span class="truncate text-sm font-medium">{item.name}</span>
								<span class="text-xs text-muted-foreground">{formatRupiah(item.unitPrice)}</span>
							</div>
							<div class="flex items-center gap-3">
								<div class="flex items-center rounded-md border border-border bg-background">
									<button
										class="flex size-7 cursor-pointer items-center justify-center text-muted-foreground hover:bg-border/50 hover:text-foreground"
										onclick={() => updateQty(item.productId, -1)}
									>
										{#if item.qty === 1}
											<Trash2 class="size-3 text-destructive" />
										{:else}
											<Minus class="size-3" />
										{/if}
									</button>
									<span class="w-8 text-center font-mono text-xs">{item.qty}</span>
									<button
										class="flex size-7 cursor-pointer items-center justify-center text-muted-foreground hover:bg-border/50 hover:text-foreground"
										onclick={() => updateQty(item.productId, 1)}
									>
										<Plus class="size-3" />
									</button>
								</div>
								<span class="w-20 text-right font-mono text-sm font-bold text-foreground">
									{formatRupiah(item.subtotal)}
								</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Checkout Section -->
			<div class="border-t border-border bg-background/50 p-4">
				<div class="mb-4 flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Total Tagihan</span>
					<span class="font-tight text-xl font-bold text-primary">{formatRupiah(cartTotal)}</span>
				</div>

				<div class="space-y-3">
					<div>
						<label
							for="paymentMethod"
							class="mb-1.5 block font-mono text-[10px] text-muted-foreground uppercase"
							>Metode Pembayaran</label
						>
						<Select.Root type="single" bind:value={paymentMethod as string}>
							<Select.Trigger class="w-full bg-card" id="paymentMethod">
								{PAYMENT_METHODS.find((p) => p.value === paymentMethod)?.label || 'Pilih Metode'}
							</Select.Trigger>
							<Select.Content>
								{#each PAYMENT_METHODS as method (method.value)}
									<Select.Item value={method.value}>{method.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<label
							for="amountPaid"
							class="mb-1.5 block font-mono text-[10px] text-muted-foreground uppercase"
							>Jumlah Dibayar (Rp)</label
						>
						<Input
							id="amountPaid"
							type="text"
							class="font-mono text-lg font-bold placeholder:text-muted-foreground/30 focus-visible:ring-primary"
							placeholder="Rp 0"
							value={amountPaidText}
							oninput={handleAmountPaidInput}
							disabled={cart.length === 0}
						/>
					</div>

					<div class="flex items-center justify-between pt-2">
						<span class="text-sm text-muted-foreground">Kembalian</span>
						<span
							class="font-mono text-lg font-bold {changeAmount >= 0
								? 'text-foreground'
								: 'text-destructive'}"
						>
							{formatRupiah(changeAmount >= 0 ? changeAmount : 0)}
						</span>
					</div>
				</div>

				<Button
					class="mt-6 h-12 w-full bg-primary text-sm font-bold tracking-wide text-primary-foreground"
					disabled={!canCheckout}
					onclick={handleCheckout}
				>
					{isSubmitting ? 'MEMPROSES...' : 'BAYAR SEKARANG'}
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<!-- Receipt Modal -->
<Dialog.Root bind:open={receiptModalOpen} onOpenChange={(v) => !v && resetCart()}>
	<Dialog.Content class="max-w-sm border-border bg-card p-0 sm:max-w-106.5">
		<div
			class="flex flex-col items-center justify-center border-b border-dashed border-border p-8 text-center"
		>
			<div
				class="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/20 text-primary"
			>
				<CheckCircle2 class="size-8" />
			</div>
			<Dialog.Title class="font-tight text-2xl font-bold">Transaksi Sukses</Dialog.Title>
			<p class="mt-2 text-sm text-muted-foreground">
				No. {receiptData?.trxNumber}
			</p>
		</div>

		<div class="space-y-4 bg-background/50 p-6">
			<div class="flex items-center justify-between text-sm">
				<span class="text-muted-foreground">Total Belanja</span>
				<span class="font-bold">{formatRupiah(receiptData?.totalAmount)}</span>
			</div>

			<div class="border-t border-dashed border-border pt-3">
				<p class="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
					Daftar Item
				</p>
				<div class="max-h-32 space-y-2 overflow-y-auto">
					{#if receiptData?.items}
						{#each receiptData.items as item (item.productId)}
							<div class="flex items-start justify-between text-xs">
								<div class="flex-1 pr-4">
									<p class="font-medium">{item.name}</p>
									<p class="mt-0.5 text-muted-foreground">
										{item.qty} x {formatRupiah(Number(item.unitPrice))}
									</p>
								</div>
								<p class="font-mono font-semibold">{formatRupiah(Number(item.subtotal))}</p>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<div class="border-t border-dashed border-border pt-3">
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Tunai/Dibayar</span>
					<span class="font-bold">{formatRupiah(receiptData?.amountPaid)}</span>
				</div>
				<div class="mt-2 flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Kembalian</span>
					<span class="font-bold text-primary">{formatRupiah(receiptData?.changeAmount)}</span>
				</div>
			</div>
		</div>

		<Dialog.Footer class="mt-6 flex flex-col gap-2 p-6 pt-0 sm:flex-col sm:justify-center">
			<Button class="w-full bg-primary text-primary-foreground" onclick={resetCart}>
				Transaksi Baru
			</Button>
			<div class="flex w-full items-center gap-2">
				<Button
					variant="outline"
					class="flex-1 border-border"
					href={`/transactions/${receiptData?.trxNumber || ''}`}
				>
					Lihat Struk
				</Button>
				{#if receiptData}
					<SerialPrintButton
						{receiptData}
						tenantName={data.user?.tenantName || 'Transa Store'}
						cashierName={data.user?.name || '-'}
					/>
				{/if}
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
