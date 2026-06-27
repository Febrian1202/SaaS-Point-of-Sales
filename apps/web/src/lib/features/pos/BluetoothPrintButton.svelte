<script lang="ts">
	import { Printer } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { CartItem, PaymentMethod } from '$lib/types/ui';

	let {
		receiptData,
		tenantName,
		cashierName
	}: {
		receiptData: {
			trxNumber: string;
			totalAmount: number;
			changeAmount: number;
			items: CartItem[];
			amountPaid: number;
			paymentMethod: PaymentMethod;
			createdAt: Date;
		};
		tenantName: string;
		cashierName: string;
	} = $props();

	let isPrinting = $state(false);
	let statusPesan = $state('');

	// Helper untuk memformat panjang teks dengan spasi
	const padEnd = (str: string, length: number) => {
		return str.toString().padEnd(length, ' ');
	};

	const padStart = (str: string, length: number) => {
		return str.toString().padStart(length, ' ');
	};

	// Helper membuat garis putus-putus
	const createLine = () => {
		return '-'.repeat(32) + '\n';
	};

	// Format struk menjadi byte array untuk dikirim ke printer (ESC/POS)
	function createPrintData() {
		let text = '';

		// Header
		text += '\x1B\x40'; // ESC @ (Initialize printer)
		text += '\x1B\x61\x01'; // ESC a 1 (Center alignment)
		text += `${tenantName || 'Karis Jaya Shop'}\n`;
		text += createLine();

		// Info Transaksi
		text += '\x1B\x61\x00'; // ESC a 0 (Left alignment)
		const dateStr = receiptData.createdAt.toISOString().split('T')[0];
		const timeStr = receiptData.createdAt.toTimeString().split(' ')[0];

		text += `${padEnd(dateStr, 16)}${padStart(cashierName, 16)}\n`;
		text += `${padEnd(timeStr, 16)}${padStart('Kios Sheza', 16)}\n`;
		text += `${receiptData.trxNumber}\n`;
		text += createLine();

		// Item Transaksi
		let totalQty = 0;
		receiptData.items.forEach((item, index) => {
			totalQty += item.qty;
			text += `${index + 1}. ${item.name}\n`;
			const qtyAndPrice = `  ${item.qty} ${item.unit || 'pcs'} x ${item.unitPrice.toLocaleString('id-ID')}`;
			const subtotal = `Rp ${item.subtotal.toLocaleString('id-ID')}`;

			// Calculate spacing so subtotal is right-aligned
			const spaceLength = 32 - qtyAndPrice.length - subtotal.length;
			const spaces = spaceLength > 0 ? ' '.repeat(spaceLength) : ' ';

			text += `${qtyAndPrice}${spaces}${subtotal}\n`;
		});

		text += createLine();

		// Footer/Total
		text += `Total QTY : ${totalQty}\n\n`;

		const subTotalStr = `Rp ${receiptData.totalAmount.toLocaleString('id-ID')}`;
		text += `${padEnd('Sub Total', 16)}${padStart(subTotalStr, 16)}\n`;

		// \x1B\x45\x01 (Bold On), \x1B\x45\x00 (Bold Off)
		text += '\x1B\x45\x01';
		const totalStr = `Rp ${receiptData.totalAmount.toLocaleString('id-ID')}`;
		text += `${padEnd('Total', 16)}${padStart(totalStr, 16)}\n`;
		text += '\x1B\x45\x00';

		const bayarStr = `Rp ${receiptData.amountPaid.toLocaleString('id-ID')}`;
		text += `${padEnd(`Bayar (${receiptData.paymentMethod})`, 16)}${padStart(bayarStr, 16)}\n`;

		const kembaliStr = `Rp ${receiptData.changeAmount.toLocaleString('id-ID')}`;
		text += `${padEnd('Kembali', 16)}${padStart(kembaliStr, 16)}\n\n`;

		// Pesan Terima Kasih (Centered)
		text += '\x1B\x61\x01'; // ESC a 1 (Center alignment)
		text += 'Terimakasih Telah Berbelanja\n\n\n\n\n';

		const encoder = new TextEncoder();
		return encoder.encode(text);
	}

	async function cetakStrukBluetooth() {
		isPrinting = true;
		statusPesan = 'Mencari perangkat...';

		try {
			if (!navigator.bluetooth) {
				throw new Error('Web Bluetooth API tidak didukung di browser ini.');
			}

			// 1. Meminta izin ke perangkat
			const device = await navigator.bluetooth.requestDevice({
				filters: [
					{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
					{ namePrefix: 'POS' },
					{ namePrefix: 'Thermal' },
					{ namePrefix: 'Printer' },
					{ namePrefix: 'MTP' },
					{ namePrefix: 'RPP' }
				],
				optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
			});

			statusPesan = `Menghubungkan ke ${device.name}...`;

			// 2. Konek ke GATT Server bawaan Bluetooth
			if (!device.gatt) throw new Error('GATT Server tidak ditemukan pada perangkat.');
			const server = await device.gatt.connect();

			// 3. Dapatkan Service & Characteristic
			const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
			const characteristic = await service.getCharacteristic(
				'00002af1-0000-1000-8000-00805f9b34fb'
			);

			statusPesan = 'Mengirim data struk...';

			// 4. Siapkan Data Struk Kios Sheza (Format ESC/POS)
			const textData = createPrintData();

			// 5. Kirim data ke printer secara berurutan dalam potongan kecil (chunking)
			const CHUNK_SIZE = 100;
			for (let i = 0; i < textData.length; i += CHUNK_SIZE) {
				const chunk = textData.slice(i, i + CHUNK_SIZE);
				await characteristic.writeValue(chunk);
			}

			statusPesan = 'Struk berhasil dicetak!';

			device.gatt.disconnect();
		} catch (error: any) {
			console.error(error);
			statusPesan =
				error.name === 'NotFoundError'
					? 'Dibatalkan atau printer tidak ditemukan'
					: `Gagal print: ${error.message}`;
		} finally {
			isPrinting = false;
			setTimeout(() => (statusPesan = ''), 3000);
		}
	}
</script>

<div class="flex h-10 flex-col">
	<Button
		variant="outline"
		class="flex-1 border-border"
		onclick={cetakStrukBluetooth}
		disabled={isPrinting}
	>
		<Printer class="mr-2 size-4" />
		{isPrinting ? 'Mencetak...' : 'Cetak Bluetooth'}
	</Button>

	{#if statusPesan}
		<p class="text-center text-xs text-muted-foreground">{statusPesan}</p>
	{/if}
</div>
