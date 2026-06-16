<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { staffSchema } from '$lib/schemas';
	import { slide, scale } from 'svelte/transition';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Eye, EyeClosed } from 'lucide-svelte';
	import type { StaffItem } from '$lib/types/ui';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		staff?: StaffItem | null;
	};

	let { open = $bindable(false), onOpenChange, staff = null }: Props = $props();

	// State form input
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);

	// State visibility password
	let isVisible = $state(false);
	let isVisibleConfirm = $state(false);

	const isEdit = $derived(!!staff);
	const formAction = $derived(isEdit ? '?/update' : '?/create');

	// State error reaktif
	let errors = $state<{
		name?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});

	function resetForm() {
		name = '';
		email = '';
		password = '';
		confirmPassword = '';
		errors = {};
		isVisible = false;
		isVisibleConfirm = false;
	}

	function handleOpenChange(val: boolean) {
		if (!val) resetForm();
		onOpenChange?.(val);
	}

	// Pre-fill values when staff changes
	$effect(() => {
		if (staff) {
			name = staff.name || '';
			email = staff.email || '';
			password = ''; // Jangan tampilkan password lama
			confirmPassword = '';
		} else {
			resetForm();
		}
	});

	// Fungsi validasi real-time per kolom
	function validateField(field: 'name' | 'email' | 'password' | 'confirmPassword') {
		const result = staffSchema.safeParse({
			name,
			email,
			password: password || undefined, // Allow undefined for validation if it's empty
			confirmPassword: confirmPassword || undefined
		});

		if (result.success) {
			errors[field] = undefined;
			if (field === 'password') errors.confirmPassword = undefined;
			if (field === 'confirmPassword') errors.password = undefined;
		} else {
			const fieldErrors = result.error.flatten().fieldErrors;
			if (field === 'name') errors.name = fieldErrors.name?.[0];
			if (field === 'email') errors.email = fieldErrors.email?.[0];

			// Always update both password errors since they depend on each other via .refine
			errors.password = fieldErrors.password?.[0];
			errors.confirmPassword = fieldErrors.confirmPassword?.[0];
		}
	}

	// Submit handler
	const handleEnhance: SubmitFunction = ({ cancel }) => {
		const dataToValidate: Record<string, string> = { name, email };
		if (!isEdit || (password && password.trim() !== '')) {
			dataToValidate.password = password;
			dataToValidate.confirmPassword = confirmPassword;
		}

		const result = staffSchema.safeParse(dataToValidate);

		if (!result.success) {
			cancel(); // Batalkan pengiriman ke server
			const fieldErrors = result.error.flatten().fieldErrors;
			errors = {
				name: fieldErrors.name?.[0],
				email: fieldErrors.email?.[0],
				password: fieldErrors.password?.[0],
				confirmPassword: fieldErrors.confirmPassword?.[0]
			};
			return;
		}

		loading = true;
		return async ({ result, update }) => {
			loading = false;
			if (result.type === 'success' || result.type === 'redirect') {
				toast.success(
					isEdit ? 'Data staf berhasil diperbarui!' : 'Staf baru berhasil ditambahkan!'
				);
				open = false;
				resetForm();
				update(); // Reset form DOM
			} else {
				if (result.type === 'failure') {
					const data = result.data as { message?: string } | undefined;
					if (data?.message) {
						toast.error(data.message);
					} else {
						toast.error(isEdit ? 'Gagal memperbarui staf.' : 'Gagal menambahkan staf.');
					}
				} else if (result.type === 'error') {
					toast.error('Terjadi kesalahan pada sistem.');
				}
				update({ reset: false }); // Biarkan isian pengguna jika gagal validasi
			}
		};
	};
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content
		class="max-w-lg gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-2xl"
		showCloseButton={false}
	>
		<!-- Header -->
		<Dialog.Header
			class="flex flex-row items-center justify-between border-b border-border bg-background/40 px-5 py-4"
		>
			<Dialog.Title class="font-tight text-base font-semibold text-foreground">
				{isEdit ? 'Ubah Data Staf' : 'Tambah Staf Baru'}
			</Dialog.Title>
			<Dialog.Close>
				{#snippet child({ props })}
					<button
						{...props}
						class="text-muted-foreground transition-colors hover:text-foreground"
						aria-label="Tutup"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M18 6 6 18" /><path d="m6 6 12 12" />
						</svg>
					</button>
				{/snippet}
			</Dialog.Close>
		</Dialog.Header>

		<!-- Form -->
		<form
			method="POST"
			action={formAction}
			class="space-y-4 p-5"
			use:enhance={handleEnhance}
			novalidate
		>
			{#if isEdit}
				<input type="hidden" name="id" value={staff?.id} />
			{/if}

			<!-- Nama Staf -->
			<div class="group space-y-1.5">
				<Label
					class="font-mono text-[10px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.name
						? 'text-destructive'
						: 'text-muted-foreground'}"
					for="staff-name"
				>
					Nama Lengkap
				</Label>
				<Input
					id="staff-name"
					name="name"
					type="text"
					bind:value={name}
					oninput={() => validateField('name')}
					placeholder="Contoh: Budi Santoso"
					class="border-border bg-background font-sans focus:border-primary {errors.name
						? 'border-destructive focus:border-destructive'
						: ''}"
					required
				/>
				{#if errors.name}
					<p transition:slide={{ duration: 200 }} class="mt-1 text-xs text-destructive">
						{errors.name}
					</p>
				{/if}
			</div>

			<!-- Email -->
			<div class="group space-y-1.5">
				<Label
					class="font-mono text-[10px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.email
						? 'text-destructive'
						: 'text-muted-foreground'}"
					for="staff-email"
				>
					Alamat Email
				</Label>
				<Input
					id="staff-email"
					name="email"
					type="email"
					bind:value={email}
					oninput={() => validateField('email')}
					placeholder="budi@toko.com"
					class="border-border bg-background font-mono focus:border-primary {errors.email
						? 'border-destructive focus:border-destructive'
						: ''}"
					required
				/>
				{#if errors.email}
					<p transition:slide={{ duration: 200 }} class="mt-1 text-xs text-destructive">
						{errors.email}
					</p>
				{/if}
			</div>

			<!-- Password Row -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<!-- Password -->
				<div class="group space-y-1.5">
					<Label
						class="font-mono text-[10px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.password
							? 'text-destructive'
							: 'text-muted-foreground'}"
						for="staff-password"
					>
						Password {isEdit ? '(Opsional)' : ''}
					</Label>
					<div class="relative">
						<Input
							id="staff-password"
							name="password"
							type={isVisible ? 'text' : 'password'}
							bind:value={password}
							oninput={() => validateField('password')}
							placeholder={isEdit ? 'Kosongkan jika tetap' : 'Minimal 6 karakter'}
							class="border-border bg-background pr-10 font-mono focus:border-primary {errors.password
								? 'border-destructive focus:border-destructive'
								: ''}"
							required={!isEdit}
						/>
						<button
							type="button"
							onclick={() => (isVisible = !isVisible)}
							class="absolute top-1/2 right-3 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if isVisible}
								<div
									in:scale={{ duration: 200, start: 0.5 }}
									out:scale={{ duration: 200, start: 0.5 }}
									class="absolute"
								>
									<EyeClosed class="size-4" />
								</div>
							{:else}
								<div
									in:scale={{ duration: 200, start: 0.5 }}
									out:scale={{ duration: 200, start: 0.5 }}
									class="absolute"
								>
									<Eye class="size-4" />
								</div>
							{/if}
						</button>
					</div>
					{#if errors.password}
						<p transition:slide={{ duration: 200 }} class="mt-1 text-xs text-destructive">
							{errors.password}
						</p>
					{/if}
				</div>

				<!-- Konfirmasi Password -->
				<div class="group space-y-1.5">
					<Label
						class="font-mono text-[10px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.confirmPassword
							? 'text-destructive'
							: 'text-muted-foreground'}"
						for="staff-confirm-password"
					>
						Konfirmasi {isEdit ? '(Opsional)' : ''}
					</Label>
					<div class="relative">
						<Input
							id="staff-confirm-password"
							name="confirmPassword"
							type={isVisibleConfirm ? 'text' : 'password'}
							bind:value={confirmPassword}
							oninput={() => validateField('confirmPassword')}
							placeholder={isEdit ? 'Ulangi jika diubah' : 'Ulangi password'}
							class="border-border bg-background pr-10 font-mono focus:border-primary {errors.confirmPassword
								? 'border-destructive focus:border-destructive'
								: ''}"
							required={!isEdit || (!!password && password.trim() !== '')}
						/>
						<button
							type="button"
							onclick={() => (isVisibleConfirm = !isVisibleConfirm)}
							class="absolute top-1/2 right-3 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if isVisibleConfirm}
								<div
									in:scale={{ duration: 200, start: 0.5 }}
									out:scale={{ duration: 200, start: 0.5 }}
									class="absolute"
								>
									<EyeClosed class="size-4" />
								</div>
							{:else}
								<div
									in:scale={{ duration: 200, start: 0.5 }}
									out:scale={{ duration: 200, start: 0.5 }}
									class="absolute"
								>
									<Eye class="size-4" />
								</div>
							{/if}
						</button>
					</div>
					{#if errors.confirmPassword}
						<p transition:slide={{ duration: 200 }} class="mt-1 text-xs text-destructive">
							{errors.confirmPassword}
						</p>
					{/if}
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-3 pt-2">
				<Dialog.Close>
					{#snippet child({ props })}
						<Button
							{...props}
							type="button"
							variant="outline"
							class="flex-1 border-border font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
							disabled={loading}
						>
							Batal
						</Button>
					{/snippet}
				</Dialog.Close>
				<Button
					type="submit"
					class="flex-1 bg-primary font-mono text-xs font-bold text-primary-foreground hover:brightness-110 active:scale-95"
					disabled={loading}
				>
					{loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Staf'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
