import { z } from 'zod';

export const productSchema = z.object({
	name: z.string().min(1, 'Nama produk tidak boleh kosong'),
	barcode: z.string().optional(),
	categoryId: z.string().optional(),
	sellingPrice: z.coerce.number({ message: 'Harga harus angka' }).min(1, 'Harga minimal 1'),
	stockQty: z.coerce.number({ message: 'Stok harus angka' }).min(0, 'Stok tidak boleh negatif'),
	unit: z.string().min(1, 'Satuan/unit wajib diisi')
});

export type ProductInput = z.infer<typeof productSchema>;
