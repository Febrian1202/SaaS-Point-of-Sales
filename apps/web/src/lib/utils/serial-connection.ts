export class SerialConnection {
	private port: SerialPort | null = null;
	private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
	public isConnected: boolean = false;

	// Cek support browser
	static isSupported() {
		return 'serial' in navigator;
	}

	async connect(baudRate: number = 9600): Promise<void> {
		if (!SerialConnection.isSupported()) {
			throw new Error('Serial port tidak didukung di browser ini');
		}

		try {
			this.port = await navigator.serial.requestPort();

			await this.port.open({ baudRate });
			this.writer = this.port.writable?.getWriter() ?? null;
			this.isConnected = true;
		} catch (e) {
			this.isConnected = false;
			throw e;
		}
	}

	async disconnect(): Promise<void> {
		if (!this.isConnected) return;

		try {
			if (this.writer) {
				await this.writer.close();
			}
			if (this.port) {
				await this.port.close();
			}
			this.isConnected = false;
		} finally {
			this.port = null;
			this.writer = null;
			this.isConnected = false;
		}
	}

	async writeData(uint8ArrayData: Uint8Array): Promise<void> {
		if (!this.isConnected || !this.writer) {
			throw new Error('Port belum siap atau printer tidak terhubung');
		}

		await this.writer.write(uint8ArrayData);
	}

	getDeviceInfo(): { vendorId: string | null; productId: string | null } | null {
		if (!this.isConnected || !this.port) return null;

		const info = this.port.getInfo();
		return {
			vendorId: info.usbVendorId ? `0x${info.usbVendorId.toString(16).padStart(4, '0')}` : null,
			productId: info.usbProductId ? `0x${info.usbProductId.toString(16).padStart(4, '0')}` : null
		};
	}
}

export const serialConnection = new SerialConnection();
