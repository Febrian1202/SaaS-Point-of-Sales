<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Store, User, Mail, Lock, ShieldCheck, ArrowRight, Eye, EyeClosed } from 'lucide-svelte';
	import type { ActionData, SubmitFunction } from './$types';
	import { registerSchema } from '$lib/schemas';
	import { base } from '$app/paths';

	let { form }: { form: ActionData } = $props();

	// State form input
	let storeName = $state('');
	let userName = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	// State error reaktif
	let errors = $state<{
		storeName?: string;
		userName?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});

	// State visibility password
	let isVisible = $state(false);
	let isVisibleConfirm = $state(false);

	// Fungsi validasi real-time per kolom
	function validateField(
		field: 'storeName' | 'userName' | 'email' | 'password' | 'confirmPassword'
	) {
		const result = registerSchema.safeParse({
			storeName,
			userName,
			email,
			password,
			confirmPassword
		});
		if (result.success) {
			errors[field] = undefined;
		} else {
			const fieldErrors = result.error.flatten().fieldErrors;
			errors[field] = fieldErrors[field]?.[0];
		}
	}

	// Submit handler yang terintegrasi dengan SvelteKit progressive enhancement
	const handleEnhance: SubmitFunction = ({ cancel }) => {
		const result = registerSchema.safeParse({
			storeName,
			userName,
			email,
			password,
			confirmPassword
		});

		if (!result.success) {
			cancel(); // Batalkan pengiriman ke server
			const fieldError = result.error.flatten().fieldErrors;
			errors = {
				storeName: fieldError.storeName?.[0],
				userName: fieldError.userName?.[0],
				email: fieldError.email?.[0],
				password: fieldError.password?.[0],
				confirmPassword: fieldError.confirmPassword?.[0]
			};
		}
	};
</script>

<svelte:head>
	<title>Registrasi Toko Baru | Kios Sheza</title>
</svelte:head>

<main
	class="relative z-10 mx-auto flex min-h-screen w-full max-w-140 animate-in flex-col justify-center px-4 py-12 duration-700 fade-in slide-in-from-bottom-4"
>
	<!-- Brand Identity -->
	<div class="mb-10 flex flex-col items-center text-center">
		<div
			class="mb-4 flex size-16 items-center justify-center rounded-md bg-primary shadow-[0_0_30px_rgba(180,255,57,0.2)]"
		>
			<Store class="size-8 text-primary-foreground" />
		</div>
		<h1 class="mb-1 font-tight text-4xl font-semibold tracking-tight text-foreground">Transa</h1>
		<p class="font-sans text-secondary-foreground">Buka lembaran baru untuk bisnis Anda.</p>
	</div>

	<!-- Registration Card -->
	<Card.Root class="overflow-hidden rounded-lg border-border bg-card shadow-2xl">
		<Card.Header class="pb-6 text-center">
			<Card.Title class="font-tight text-2xl tracking-tight text-foreground"
				>Registrasi Toko</Card.Title
			>
			<Card.Description class="text-secondary-foreground">
				Daftar untuk memulai transaksi Anda.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance={handleEnhance} novalidate class="space-y-5">
				<!-- Nama Toko -->
				<div class="group space-y-2">
					<Label
						for="storeName"
						class="font-mono text-[11px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.storeName
							? 'text-destructive'
							: 'text-secondary-foreground'}">Nama Toko</Label
					>
					<div class="relative">
						<Store
							class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
						/>
						<Input
							id="storeName"
							name="storeName"
							type="text"
							bind:value={storeName}
							oninput={() => validateField('storeName')}
							placeholder="Contoh: Kios Berkah Jaya"
							required
							class="h-11 border-border bg-background pl-10 transition-all focus:border-primary {errors.storeName
								? 'border-destructive focus:border-destructive'
								: ''}"
						/>
					</div>
					{#if errors.storeName}
						<p class="mt-1 text-xs text-destructive">{errors.storeName}</p>
					{/if}
				</div>

				<!-- Nama Pemilik -->
				<div class="group space-y-2">
					<Label
						for="userName"
						class="font-mono text-[11px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.userName
							? 'text-destructive'
							: 'text-secondary-foreground'}">Nama Pemilik</Label
					>
					<div class="relative">
						<User
							class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
						/>
						<Input
							id="userName"
							name="userName"
							type="text"
							bind:value={userName}
							oninput={() => validateField('userName')}
							placeholder="Nama Lengkap Anda"
							required
							class="h-11 border-border bg-background pl-10 transition-all focus:border-primary {errors.userName
								? 'border-destructive focus:border-destructive'
								: ''}"
						/>
					</div>
					{#if errors.userName}
						<p class="mt-1 text-xs text-destructive">{errors.userName}</p>
					{/if}
				</div>

				<!-- Email -->
				<div class="group space-y-2">
					<Label
						for="email"
						class="font-mono text-[11px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.email
							? 'text-destructive'
							: 'text-secondary-foreground'}">Email</Label
					>
					<div class="relative">
						<Mail
							class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
						/>
						<Input
							id="email"
							name="email"
							type="email"
							bind:value={email}
							oninput={() => validateField('email')}
							placeholder="email@bisnisanda.com"
							required
							class="h-11 border-border bg-background pl-10 transition-all focus:border-primary {errors.email
								? 'border-destructive focus:border-destructive'
								: ''}"
						/>
					</div>
					{#if errors.email}
						<p class="mt-1 text-xs text-destructive">{errors.email}</p>
					{/if}
				</div>

				<!-- Password Row -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Password -->
					<div class="group space-y-2">
						<Label
							for="password"
							class="font-mono text-[11px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.password
								? 'text-destructive'
								: 'text-secondary-foreground'}">Password</Label
						>
						<div class="relative">
							<Lock
								class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
							/>
							<Input
								id="password"
								name="password"
								type={isVisible ? 'text' : 'password'}
								bind:value={password}
								oninput={() => validateField('password')}
								placeholder="••••••••"
								required
								class="h-11 border-border bg-background pl-10 transition-all focus:border-primary {errors.password
									? 'border-destructive focus:border-destructive'
									: ''}"
							/>
							<button
								type="button"
								onclick={() => (isVisible = !isVisible)}
								class="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-secondary-foreground"
							>
								{#if isVisible}
									<Eye class="size-5" />
								{:else}
									<EyeClosed class="size-5" />
								{/if}
							</button>
						</div>
						{#if errors.password}
							<p class="mt-1 text-xs text-destructive">{errors.password}</p>
						{/if}
					</div>

					<!-- Konfirmasi Password -->
					<div class="group space-y-2">
						<Label
							for="confirmPassword"
							class="font-mono text-[11px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.confirmPassword
								? 'text-destructive'
								: 'text-secondary-foreground'}">Konfirmasi</Label
						>
						<div class="relative">
							<ShieldCheck
								class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
							/>
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type={isVisibleConfirm ? 'text' : 'password'}
								bind:value={confirmPassword}
								oninput={() => validateField('confirmPassword')}
								placeholder="••••••••"
								required
								class="h-11 border-border bg-background pl-10 transition-all focus:border-primary {errors.confirmPassword
									? 'border-destructive focus:border-destructive'
									: ''}"
							/>
							<button
								type="button"
								onclick={() => (isVisibleConfirm = !isVisibleConfirm)}
								class="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-secondary-foreground"
							>
								{#if isVisibleConfirm}
									<Eye class="size-5" />
								{:else}
									<EyeClosed class="size-5" />
								{/if}
							</button>
						</div>
						{#if errors.confirmPassword}
							<p class="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
						{/if}
					</div>
				</div>

				<!-- Privacy Policy / Terms -->
				<div class="flex items-start space-x-2 pt-2">
					<Checkbox id="terms" required class="mt-0.5" />
					<label
						for="terms"
						class="cursor-pointer text-sm leading-normal font-normal text-secondary-foreground"
					>
						Saya menyetujui <a href="/terms" class="text-primary hover:underline"
							>Syarat & Ketentuan</a
						> serta Kebijakan Privasi Kios Sheza.
					</label>
				</div>

				<!-- Submit Button -->
				<Button
					type="submit"
					class="h-12 w-full rounded-md bg-primary font-tight text-base font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
				>
					DAFTAR SEKARANG
					<ArrowRight class="ml-2 size-5" />
				</Button>

				{#if form?.message}
					<p class="mt-2 text-center text-sm font-medium text-destructive">{form.message}</p>
				{/if}
			</form>
		</Card.Content>
		<Card.Footer class="justify-center border-t border-border py-4">
			<p class="text-sm text-secondary-foreground">
				Sudah memiliki akun toko?
				<a href="{base}/login" class="ml-1 font-bold text-primary hover:underline">Masuk Sekarang</a
				>
			</p>
		</Card.Footer>
	</Card.Root>
	{@render statusInfo()}
</main>

{#snippet statusInfo()}
	<!-- System Status Info -->
	<div class="mt-8 flex items-center justify-center space-x-4">
		<div class="flex items-center space-x-2">
			<div class="size-1.5 animate-pulse rounded-full bg-primary"></div>
			<span class="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase"
				>Sistem Operasional</span
			>
		</div>
		<div class="size-1 rounded-full bg-border"></div>
		<span class="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase"
			>v2.4.0</span
		>
	</div>
{/snippet}
