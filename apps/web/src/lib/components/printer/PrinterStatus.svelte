<script lang="ts">
	import { Printer, Unplug, Usb } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { serialConnection } from '$lib/utils/serial-connection';
	import { toast } from 'svelte-sonner';

	let isConnected = $state(serialConnection.isConnected);
	let isConnecting = $state(false);
	let isSupported = $derived(typeof window !== 'undefined' && 'serial' in navigator);
	let deviceInfo = $state<{ vendorId: string | null; productId: string | null } | null>(null);

	async function handleConnect() {
		if (!isSupported) {
			toast.error('Browser tidak mendukung Web Serial API');
			return;
		}

		isConnecting = true;
		try {
			await serialConnection.connect(9600);
			isConnected = true;
			deviceInfo = serialConnection.getDeviceInfo();
			toast.success('Printer terhubung');
		} catch (e) {
			isConnected = false;
			deviceInfo = null;
			if (e instanceof DOMException && e.name === 'NotFoundError') {
				// User cancelled the port picker — no toast needed
			} else {
				toast.error(e instanceof Error ? e.message : 'Gagal menghubungkan printer');
			}
		} finally {
			isConnecting = false;
		}
	}

	async function handleDisconnect() {
		try {
			await serialConnection.disconnect();
			isConnected = false;
			deviceInfo = null;
			toast.success('Printer diputuskan');
		} catch {
			toast.error('Gagal memutuskan koneksi');
		}
	}
</script>

{#if !isSupported}
	<div
		class="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 opacity-50"
		title="Browser tidak mendukung Web Serial API"
	>
		<Printer class="size-3.5 text-muted-foreground" />
		<span class="font-mono text-[10px] text-muted-foreground">Tidak didukung</span>
	</div>
{:else if isConnected}
	<Popover.Root>
		<Popover.Trigger>
			<button
				class="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 transition-colors hover:bg-border/50"
			>
				<span class="relative flex size-2">
					<span
						class="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"
					></span>
					<span class="relative inline-flex size-2 rounded-full bg-green-500"></span>
				</span>
				<span class="font-mono text-[10px] text-green-500">Terhubung</span>
			</button>
		</Popover.Trigger>
		<Popover.Content align="end" class="w-56 border-border bg-card p-0">
			<div class="border-b border-border p-3">
				<p class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
					Info Perangkat
				</p>
				{#if deviceInfo}
					<div class="mt-2 space-y-1">
						<div class="flex items-center justify-between">
							<span class="text-[10px] text-muted-foreground">Vendor ID</span>
							<span class="font-mono text-[10px] font-medium text-foreground">
								{deviceInfo.vendorId || '-'}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-[10px] text-muted-foreground">Product ID</span>
							<span class="font-mono text-[10px] font-medium text-foreground">
								{deviceInfo.productId || '-'}
							</span>
						</div>
					</div>
				{:else}
					<p class="mt-1 text-[10px] text-muted-foreground">Info tidak tersedia</p>
				{/if}
			</div>
			<div class="p-2">
				<Button
					variant="ghost"
					size="sm"
					class="w-full justify-start gap-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
					onclick={handleDisconnect}
				>
					<Unplug class="size-3.5" />
					Putuskan Koneksi
				</Button>
			</div>
		</Popover.Content>
	</Popover.Root>
{:else}
	<button
		class="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 transition-colors hover:bg-border/50 disabled:pointer-events-none disabled:opacity-50"
		onclick={handleConnect}
		disabled={isConnecting}
	>
		<Usb class="size-3.5 text-muted-foreground" />
		<span class="font-mono text-[10px] text-muted-foreground">
			{isConnecting ? 'Menyambung...' : 'Hubungkan'}
		</span>
	</button>
{/if}
