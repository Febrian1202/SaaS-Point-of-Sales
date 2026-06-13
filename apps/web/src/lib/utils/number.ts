export function formatRupiah(value: number | string | null | undefined) {
	if (value === null || value === undefined) return 'Rp 0';
	const num = typeof value === 'string' ? parseFloat(value) : value;
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(num);
}
