export function getProductDisplay(items: Array<{ product?: { name: string } }>) {
	if (!items || items.length === 0) return '-';
	const firstName = items[0]?.product?.name || 'Produk';
	if (items.length > 1) {
		return `${firstName} (+${items.length - 1} lainnya)`;
	}
	return firstName;
}
