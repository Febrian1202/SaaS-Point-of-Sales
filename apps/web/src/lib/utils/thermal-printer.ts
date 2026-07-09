import type { SerialConnection } from './serial-connection';

class ThermalPrinterError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ThermalPrinterError';
	}
}

export type ReceiptData = {
	trxNumber: string;
	totalAmount: number;
	changeAmount: number;
	items: { name: string; qty: number; unitPrice: number; subtotal: number }[];
	amountPaid: number;
	paymentMethod: string;
	createdAt: Date;
};

const LINE_WIDTH = 32;

export class ThermalPrinter {
	private connection: SerialConnection;
	private encoder: TextEncoder;

	// Dependency Injection
	constructor(connection: SerialConnection) {
		this.connection = connection;
		this.encoder = new TextEncoder();
	}

	// ── Low-level helpers ──────────────────────────────────────

	async printText(text: string): Promise<void> {
		if (!this.connection.isConnected) {
			throw new ThermalPrinterError('Not connected to thermal printer');
		}

		const data = this.encoder.encode(text);
		await this.connection.writeData(data);
	}

	async printNewLine(lines: number = 1): Promise<void> {
		await this.printText('\n'.repeat(lines));
	}

	async printSeparator(char: string = '-', length: number = LINE_WIDTH): Promise<void> {
		await this.printText(char.repeat(length) + '\n');
	}

	async initialize(): Promise<void> {
		if (!this.connection.isConnected) {
			throw new ThermalPrinterError('Not connected to thermal printer');
		}

		// ESC @ — initialise printer
		const ESC_INIT = new Uint8Array([0x1b, 0x40]);
		await this.connection.writeData(ESC_INIT);
	}

	async cutPaper(): Promise<void> {
		if (!this.connection.isConnected) {
			throw new ThermalPrinterError('Not connected to thermal printer');
		}

		// GS V 65 16 — partial cut with feed
		const GS_CUT = new Uint8Array([0x1d, 0x56, 0x41, 0x10]);
		await this.connection.writeData(GS_CUT);
	}

	// ── ESC/POS formatting commands ────────────────────────────

	private async alignCenter(): Promise<void> {
		// ESC a 1
		await this.connection.writeData(new Uint8Array([0x1b, 0x61, 0x01]));
	}

	private async alignLeft(): Promise<void> {
		// ESC a 0
		await this.connection.writeData(new Uint8Array([0x1b, 0x61, 0x00]));
	}

	private async setBold(on: boolean): Promise<void> {
		// ESC E n
		await this.connection.writeData(new Uint8Array([0x1b, 0x45, on ? 0x01 : 0x00]));
	}

	// ── Text layout utilities (58mm = 32 chars) ────────────────

	/** Left-label + right-value on one line, padded with spaces */
	private formatRow(left: string, right: string): string {
		const gap = LINE_WIDTH - left.length - right.length;
		if (gap <= 0) {
			// Truncate left if too long
			const trimmed = left.substring(0, LINE_WIDTH - right.length - 1);
			return trimmed + ' ' + right + '\n';
		}
		return left + ' '.repeat(gap) + right + '\n';
	}

	/** Center a string within LINE_WIDTH */
	private centerText(text: string): string {
		if (text.length >= LINE_WIDTH) return text.substring(0, LINE_WIDTH) + '\n';
		const pad = Math.floor((LINE_WIDTH - text.length) / 2);
		return ' '.repeat(pad) + text + '\n';
	}

	/** Format number as id-ID locale (no currency symbol, compact) */
	private fmtNum(value: number): string {
		return value.toLocaleString('id-ID');
	}

	// ── Receipt printing ───────────────────────────────────────

	async printReceipt(receipt: ReceiptData, tenantName: string, cashierName: string): Promise<void> {
		if (!this.connection.isConnected) {
			throw new ThermalPrinterError('Not connected to thermal printer');
		}

		await this.initialize();

		// ── Header ──
		await this.alignCenter();
		await this.setBold(true);
		await this.printText(this.centerText(tenantName));
		await this.setBold(false);
		await this.alignLeft();

		await this.printSeparator();

		// ── Transaction info ──
		await this.printText(this.formatRow('No:', receipt.trxNumber));
		await this.printText(
			this.formatRow(
				'Tgl:',
				receipt.createdAt.toLocaleString('id-ID', {
					dateStyle: 'short',
					timeStyle: 'short'
				})
			)
		);
		await this.printText(this.formatRow('Ksr:', cashierName));

		await this.printSeparator();

		// ── Items ──
		for (const item of receipt.items) {
			// Item name (bold, on its own line)
			await this.setBold(true);
			const name = item.name.length > LINE_WIDTH ? item.name.substring(0, LINE_WIDTH) : item.name;
			await this.printText(name + '\n');
			await this.setBold(false);

			// qty x price        subtotal
			const qtyLine = `${item.qty} x ${this.fmtNum(item.unitPrice)}`;
			const subtotalStr = this.fmtNum(item.subtotal);
			await this.printText(this.formatRow(qtyLine, subtotalStr));
		}

		await this.printSeparator();

		// ── Totals ──
		await this.setBold(true);
		await this.printText(this.formatRow('TOTAL', this.fmtNum(receipt.totalAmount)));
		await this.setBold(false);

		const payLabel = `BAYAR (${receipt.paymentMethod.toUpperCase()})`;
		await this.printText(this.formatRow(payLabel, this.fmtNum(receipt.amountPaid)));
		await this.printText(this.formatRow('KEMBALI', this.fmtNum(receipt.changeAmount)));

		await this.printSeparator();

		// ── Footer ──
		await this.alignCenter();
		await this.printText(this.centerText('Terima Kasih'));
		await this.alignLeft();

		// Feed + cut
		await this.printNewLine(4);
		await this.cutPaper();
	}
}
