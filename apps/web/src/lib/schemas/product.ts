import { z } from 'zod';

export const productSchema = z.object({
	name: z.string().min(1, 'Nama produk tidak boleh kosong'),
	barcode: z.string().optional(),
	categoryId: z.string().optional(),
	sellingPrice: z.string().min(1, 'Harga tidak boleh kosong'),
	stockQty: z.number().min(0, 'Stok tidak boleh negatif'),
	unit: z.string().min(1, 'Satuan/unit wajib diisi')
});

export type ProductInput = z.infer<typeof productSchema>;
