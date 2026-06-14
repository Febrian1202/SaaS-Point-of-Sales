<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Trash2 } from 'lucide-svelte';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/** Nama entitas yang akan dihapus, ditampilkan di deskripsi */
		itemName?: string;
		onConfirm?: () => void | Promise<void>;
	};

	let { open = $bindable(false), onOpenChange, itemName, onConfirm }: Props = $props();

	let loading = $state(false);

	async function handleConfirm() {
		loading = true;
		try {
			await onConfirm?.();
			open = false;
		} finally {
			loading = false;
		}
	}
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Content
		class="max-w-sm gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-2xl"
		showCloseButton={false}
	>
		<div class="flex flex-col items-center p-8 text-center">
			<!-- Icon -->
			<div
				class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive"
			>
				<Trash2 class="size-8" />
			</div>

			<!-- Title -->
			<Dialog.Title class="mb-1.5 font-tight text-base font-semibold text-foreground">
				Hapus Produk?
			</Dialog.Title>

			<!-- Description -->
			<Dialog.Description class="font-sans text-sm text-muted-foreground">
				{#if itemName}
					Produk <span class="font-medium text-foreground">"{itemName}"</span> akan dihapus permanen dari
					inventaris. Tindakan ini tidak dapat dibatalkan.
				{:else}
					Tindakan ini tidak dapat dibatalkan. Produk akan dihapus permanen dari inventaris.
				{/if}
			</Dialog.Description>

			<!-- Actions -->
			<div class="mt-7 flex w-full gap-3">
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
					type="button"
					variant="destructive"
					class="flex-1 bg-destructive font-mono text-xs font-bold text-destructive-foreground hover:brightness-110 active:scale-95"
					disabled={loading}
					onclick={handleConfirm}
				>
					{loading ? 'Menghapus...' : 'Hapus'}
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
