import { z } from 'zod';

export const loginSchema = z.object({
	email: z.email({ error: 'Email tidak valid' }).min(1, 'Email tidak boleh kosong'),
	password: z.string().min(6, 'Password minimal harus 6 karakter')
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
	.object({
		storeName: z.string().min(1, 'Nama Toko tidak boleh kosong'),
		userName: z.string().min(1, 'Nama Pemilik tidak boleh kosong'),
		email: z.email({ error: 'Email tidak valid' }).min(1, 'Email tidak boleh kosong'),
		password: z
			.string()
			.min(6, 'Password minimal harus 6 karakter')
			.regex(/[A-Z]/, { message: 'Password harus mengandung huruf besar' })
			.regex(/[a-z]/, { message: 'Password harus mengandung huruf kecil' })
			.regex(/[0-9]/, { message: 'Password harus mengandung angka' })
			.regex(/[^A-Za-z0-9]/, { message: 'Password harus mengandung karakter khusus' }),
		confirmPassword: z.string(),
		terms: z.boolean().refine((val) => val === true, {
			message: 'Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi'
		})
	})
	.refine((data) => data.password === data.confirmPassword, {
		error: 'Password dan Konfirmasi Password tidak cocok',
		path: ['confirmPassword']
	});

export type RegisterInput = z.infer<typeof registerSchema>;
