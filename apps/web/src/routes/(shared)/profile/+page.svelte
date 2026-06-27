<script lang="ts">
	import { Shield, Calendar, Mail } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import * as Avatar from '$lib/components/ui/avatar';
	import { toast } from 'svelte-sonner';
	import { deserialize } from '$app/forms';

	let { data } = $props();
	const profile = $derived(data.profile);

	let isSubmitting = $state(false);

	// Form state
	let name = $derived(profile?.name || '');
	let password = $state('');
	let confirmPassword = $state('');

	const canSubmit = $derived(
		name.length >= 3 &&
			(password === '' || (password.length >= 6 && password === confirmPassword)) &&
			!isSubmitting
	);

	const passMismatch = $derived(
		password !== '' && confirmPassword !== '' && password !== confirmPassword
	);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!canSubmit) return;

		isSubmitting = true;

		const formData = new FormData();
		if (name !== profile?.name) formData.append('name', name);
		if (password) formData.append('password', password);

		// Jika tidak ada perubahan, batalkan submit
		if (Array.from(formData.keys()).length === 0) {
			isSubmitting = false;
			toast.info('Tidak ada perubahan yang perlu disimpan');
			return;
		}

		try {
			const response = await fetch('?/update', { method: 'POST', body: formData });
			const result = deserialize(await response.text());

			if (result.type === 'success') {
				toast.success((result as any).data?.message || 'Profil berhasil diperbarui');
				password = '';
				confirmPassword = '';
			} else {
				toast.error((result as any)?.data?.message ?? 'Gagal memperbarui profil');
			}
		} catch (err) {
			console.error(err);
			toast.error('Terjadi kesalahan sistem');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="max-w-3xl animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-3">
	<div>
		<h1 class="font-tight text-3xl font-semibold tracking-tight text-foreground">Profil Saya</h1>
		<p class="mt-1 text-sm text-muted-foreground">Kelola informasi akun dan kata sandi Anda.</p>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
		<!-- Left: Profil Info Card -->
		<Card.Root class="h-fit border-border bg-card md:col-span-1">
			<Card.Content class="flex flex-col items-center p-6 text-center">
				<Avatar.Root class="mb-4 size-24 border-2 border-border">
					<Avatar.Image
						src="https://lh3.googleusercontent.com/aida-public/AB6AXuA83ioHC1nWhmUUUTuBI-0wap1OSU8ko4YqSGdV7LWgHJ9mC9Jx2AxgBrO1F8HyOBC7LNMM04kb-iQ46BlfKTZvkl8qLZDL3rIsNCb-t8Zf8TY2ANnUtBwhnoPn7skTetTw1w08K5q4_M3Xy5Wdtqob6qriXpfWmYuaRLB6nilI1AxCnewtMb4Gzemzit70OWCUzW8a4BH8CsvuqdcQbYiRb3tp2kyoKtaEINRG1IPC-TXPDTRGMjrPvfQVjAZt2PFsiM86i_-Lag"
						alt={profile?.name || 'User'}
					/>
					<Avatar.Fallback class="bg-border font-mono text-xl text-foreground uppercase">
						{profile?.name?.substring(0, 2) || 'US'}
					</Avatar.Fallback>
				</Avatar.Root>

				<h2 class="mb-1 font-tight text-xl font-bold">{profile?.name}</h2>
				<Badge variant="secondary" class="mb-6 font-mono text-[10px] tracking-wider uppercase">
					<Shield class="mr-1 size-3" />
					{profile?.role}
				</Badge>

				<div class="w-full space-y-3 text-left text-sm">
					<div
						class="flex items-center gap-3 rounded-md border border-border bg-background/50 p-3 text-muted-foreground"
					>
						<Mail class="size-4 shrink-0" />
						<span class="truncate">{profile?.email}</span>
					</div>

					<div
						class="flex items-center gap-3 rounded-md border border-border bg-background/50 p-3 text-muted-foreground"
					>
						<Calendar class="size-4 shrink-0" />
						<div class="truncate">
							<span class="mb-0.5 block font-mono text-[10px] uppercase">Bergabung Sejak</span>
							<span
								>{new Date((profile as any)?.createdAt || Date.now()).toLocaleDateString('id-ID', {
									month: 'long',
									year: 'numeric'
								})}</span
							>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Right: Form Edit Card -->
		<Card.Root class="border-border bg-card md:col-span-2">
			<Card.Header class="border-b border-border bg-background/30">
				<Card.Title class="font-tight text-lg">Edit Informasi Akun</Card.Title>
			</Card.Header>
			<Card.Content class="p-6">
				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="space-y-2">
						<label for="name" class="font-mono text-[10px] text-muted-foreground uppercase"
							>Nama Lengkap</label
						>
						<Input
							id="name"
							name="name"
							bind:value={name}
							class="max-w-md border-border bg-background"
							placeholder="Masukkan nama Anda"
						/>
						<p class="text-[10px] text-muted-foreground">
							Hanya huruf, angka, spasi, titik, koma, strip, dan tanda kutip. Min. 3 karakter.
						</p>
					</div>

					<div class="border-t border-border pt-4">
						<h3 class="text-md mb-4 font-tight font-semibold text-foreground">Ubah Kata Sandi</h3>
						<p class="mb-4 text-xs text-muted-foreground">
							Biarkan kosong jika tidak ingin mengubah kata sandi Anda.
						</p>

						<div class="max-w-md space-y-4">
							<div class="space-y-2">
								<label for="password" class="font-mono text-[10px] text-muted-foreground uppercase"
									>Kata Sandi Baru</label
								>
								<Input
									id="password"
									name="password"
									type="password"
									bind:value={password}
									class="border-border bg-background"
									placeholder="Minimal 6 karakter"
								/>
							</div>

							<div class="space-y-2">
								<label for="confirm" class="font-mono text-[10px] text-muted-foreground uppercase"
									>Konfirmasi Kata Sandi Baru</label
								>
								<Input
									id="confirm"
									type="password"
									bind:value={confirmPassword}
									class="bg-background {passMismatch
										? 'border-destructive focus-visible:ring-destructive'
										: 'border-border'}"
									placeholder="Ketik ulang kata sandi baru"
								/>
								{#if passMismatch}
									<p class="text-[10px] font-semibold text-destructive">
										Konfirmasi kata sandi tidak cocok.
									</p>
								{/if}
							</div>
						</div>
					</div>

					<div class="flex justify-end pt-4">
						<Button
							type="submit"
							class="bg-primary px-8 font-bold text-primary-foreground"
							disabled={!canSubmit}
						>
							{isSubmitting ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
