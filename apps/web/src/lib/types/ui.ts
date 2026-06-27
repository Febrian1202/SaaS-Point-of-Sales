/**
 * Shared UI Types
 */

export type CartItem = {
	productId: string;
	name: string;
	barcode: string | null;
	unit: string | null;
	unitPrice: number;
	qty: number;
	subtotal: number;
};

export type PaymentMethod = 'cash' | 'transfer' | 'qris';

export type BrilinkTrxType = 'transfer' | 'tarik_tunai' | 'pembayaran' | 'e-wallet' | 'other';

// Product Types
export type ProductStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type ProductItem = {
	id: string;
	barcode: string | null;
	name: string;
	categoryId: string | null;
	categoryName: string | null;
	price: string;
	stock: number;
	unit: string | null;
	status: ProductStatus;
	isActive: boolean;
};

// Category Types
export type CategoryItem = {
	id: string;
	name: string;
	slug: string;
	createdAt?: Date | string | null;
};

// Transaction Types
export type TrxItem = {
	id: string;
	transactionNumber: string;
	cashierName: string;
	totalAmount: string;
	paymentMethod: string;
	status: string;
	createdAt: string;
};

export type TrxDetail = {
	id: string;
	transactionNumber: string;
	cashierName: string;
	totalAmount: string;
	paymentMethod: string;
	status: string;
	createdAt: string;
	items: {
		id: string;
		productName: string;
		quantity: number;
		price: string;
		subtotal: string;
	}[];
};

// User & Staff Types
export type UserRole = 'admin' | 'cashier';

export type StaffItem = {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	tenantId: string;
	isActive?: boolean;
};

// Brilink Types
export type BrilinkTransaction = {
	id: string;
	bankName: string | null;
	accountName: string | null;
	accountNumber: string | null;
	amount: string;
	fee: string;
	totalAmount: string;
	status: string;
	type: string;
	cashierName: string;
	createdAt: string;
};

export type BrilinkDetail = {
	id: string;
	type: string;
	bankName: string | null;
	accountName: string | null;
	accountNumber: string | null;
	amount: string;
	fee: string;
	totalAmount: string;
	status: string;
	cashierName: string;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
};
