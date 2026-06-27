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

export const CASHIER_ROUTES = {
	DASHBOARD: '/dashboard',
	POS: '/pos',
	TRANSACTIONS: '/transactions',
	BRILINK: '/brilink',
	PROFILE: '/profile'
} as const;

export const PRODUCT_STATUSES = ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'] as const;

export const DASHBOARD_VIEWS = ['daily', 'weekly'] as const;

export const PAYMENT_METHODS = [
	{ value: 'cash', label: 'Tunai' },
	{ value: 'transfer', label: 'Transfer' },
	{ value: 'qris', label: 'QRIS' }
] as const;

export const BRILINK_TRANSACTION_TYPES = [
	{ value: 'all', label: 'Semua Tipe' },
	{ value: 'setor', label: 'Setor Tunai' },
	{ value: 'tarik', label: 'Tarik Tunai' },
	{ value: 'transfer', label: 'Transfer Sesama' },
	{ value: 'transfer_antar_bank', label: 'Transfer Antar Bank' },
	{ value: 'pembayaran', label: 'Pembayaran' },
	{ value: 'topup', label: 'Top Up E-Wallet' }
] as const;

export const BRILINK_TRX_TYPES = [
	{ value: 'transfer', label: 'Transfer' },
	{ value: 'tarik_tunai', label: 'Tarik Tunai' },
	{ value: 'pembayaran', label: 'Pembayaran' },
	{ value: 'e-wallet', label: 'E-Wallet' },
	{ value: 'other', label: 'Lainnya' }
] as const;
