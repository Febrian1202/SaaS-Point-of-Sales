import { z } from 'zod';

export const staffSchema = z
	.object({
		name: z
			.string()
			.min(3, { message: 'Nama harus minimal 3 karakter' })
			.regex(/^[a-zA-Z0-9 .,'-]+$/, {
				message: 'Hanya huruf, angka, spasi, titik, koma, strip, dan tanda kutip yang diperbolehkan'
			}),
		email: z.string().email({ message: 'Format email tidak valid' }),
		password: z
			.string()
			.min(6, { message: 'Password harus minimal 6 karakter' })
			.optional()
			.or(z.literal('')),
		confirmPassword: z.string().optional().or(z.literal(''))
	})
	.refine(
		(data) => {
			if (data.password && data.password.trim() !== '') {
				return data.password === data.confirmPassword;
			}
			return true;
		},
		{
			message: 'Password dan Konfirmasi Password tidak cocok',
			path: ['confirmPassword']
		}
	);

export type StaffFormData = z.infer<typeof staffSchema>;
