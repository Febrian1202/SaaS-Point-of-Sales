/**
 * Global application constants
 */

export const APP_ROUTES = {
	HOME: '/',
	LOGIN: '/login',
	REGISTER: '/register',
	DASHBOARD: '/admin/dashboard',
	PRODUCTS: '/admin/products',
	CATEGORIES: '/admin/categories',
	TRANSACTIONS: '/admin/transactions',
	BRILINK: '/admin/brilink'
} as const;

export const PRODUCT_STATUSES = ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'] as const;

export const DASHBOARD_VIEWS = ['daily', 'weekly'] as const;

export const BRILINK_TRANSACTION_TYPES = [
	{ value: 'all', label: 'Semua Tipe' },
	{ value: 'setor', label: 'Setor Tunai' },
	{ value: 'tarik', label: 'Tarik Tunai' },
	{ value: 'transfer', label: 'Transfer Sesama' },
	{ value: 'transfer_antar_bank', label: 'Transfer Antar Bank' },
	{ value: 'pembayaran', label: 'Pembayaran' },
	{ value: 'topup', label: 'Top Up E-Wallet' }
] as const;
