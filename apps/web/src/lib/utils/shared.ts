export function getVisiblePages(current: number, total: number) {
	if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

	if (current <= 3) return [1, 2, 3, 4, 5];
	if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
	return [current - 2, current - 1, current, current + 1, current + 2];
}
