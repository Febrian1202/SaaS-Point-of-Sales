<script lang="ts">
	import { Printer } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { serialConnection } from '$lib/utils/serial-connection';
	import { ThermalPrinter, type ReceiptData } from '$lib/utils/thermal-printer';
	import { toast } from 'svelte-sonner';

	type Props = {
		receiptData: ReceiptData;
		tenantName: string;
		cashierName: string;
	};

	let { receiptData, tenantName, cashierName }: Props = $props();

	let isPrinting = $state(false);
	let isConnected = $derived(serialConnection.isConnected);

	async function handlePrint() {
		if (!isConnected) {
			toast.error('Printer belum terhubung');
			return;
		}

		isPrinting = true;
		try {
			const printer = new ThermalPrinter(serialConnection);
			await printer.printReceipt(receiptData, tenantName, cashierName);
			toast.success('Struk berhasil dicetak');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Gagal mencetak struk');
		} finally {
			isPrinting = false;
		}
	}
</script>

<Button
	variant="outline"
	class="flex-1 border-border {isConnected ? '' : 'pointer-events-none opacity-50'}"
	onclick={handlePrint}
	disabled={!isConnected || isPrinting}
>
	<Printer class="mr-2 size-4" />
	{#if isPrinting}
		Mencetak...
	{:else if isConnected}
		Cetak Struk
	{:else}
		Printer Belum Terhubung
	{/if}
</Button>
