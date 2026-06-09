<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Store, User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-svelte';
	import type { PageProps, ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let isMatching = $derived(password === confirmPassword || confirmPassword === '');
</script>

<svelte:head>
	<title>Registrasi Toko Baru | Kios Sheza</title>
</svelte:head>

<div class="fixed inset-0 pointer-events-none opacity-20 z-0">
	<div class="absolute top-0 left-0 w-full h-full" style="background-image: radial-gradient(circle at 2px 2px, var(--border) 1px, transparent 0); background-size: 32px 32px;"></div>
</div>

<main class="relative z-10 w-full max-w-120 mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
	<!-- Brand Identity -->
	<div class="flex flex-col items-center mb-10 text-center">
		<div class="size-16 bg-primary rounded-md flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(180,255,57,0.2)]">
			<Store class="size-8 text-primary-foreground" />
		</div>
		<h1 class="font-tight text-4xl text-foreground font-semibold mb-1 tracking-tight">Kios Sheza</h1>
		<p class="font-sans text-secondary-foreground">Buka lembaran baru untuk bisnis Anda.</p>
	</div>

	<!-- Registration Card -->
	<Card.Root class="border-border bg-card shadow-2xl overflow-hidden rounded-lg">
		<Card.Header class="pb-6">
			<Card.Title class="font-tight text-2xl text-foreground">Registrasi Toko</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-5">
				<!-- Nama Toko -->
				<div class="space-y-2 group">
					<Label for="storeName" class="font-mono text-[11px] uppercase tracking-wider text-secondary-foreground group-focus-within:text-primary transition-colors">Nama Toko</Label>
					<div class="relative">
						<Store class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-secondary-foreground" />
						<Input 
							id="storeName" 
							name="storeName" 
							placeholder="Contoh: Kios Berkah Jaya" 
							required 
							class="pl-10 bg-background border-border focus:border-primary transition-all h-11"
						/>
					</div>
				</div>

				<!-- Nama Pemilik -->
				<div class="space-y-2 group">
					<Label for="userName" class="font-mono text-[11px] uppercase tracking-wider text-secondary-foreground group-focus-within:text-primary transition-colors">Nama Pemilik</Label>
					<div class="relative">
						<User class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-secondary-foreground" />
						<Input 
							id="userName" 
							name="userName" 
							placeholder="Nama Lengkap Anda" 
							required 
							class="pl-10 bg-background border-border focus:border-primary transition-all h-11"
						/>
					</div>
				</div>

				<!-- Email -->
				<div class="space-y-2 group">
					<Label for="email" class="font-mono text-[11px] uppercase tracking-wider text-secondary-foreground group-focus-within:text-primary transition-colors">Email</Label>
					<div class="relative">
						<Mail class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-secondary-foreground" />
						<Input 
							id="email" 
							name="email" 
							type="email"
							placeholder="email@bisnisanda.com" 
							required 
							class="pl-10 bg-background border-border focus:border-primary transition-all h-11"
						/>
					</div>
				</div>

				<!-- Password Row -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2 group">
						<Label for="password" class="font-mono text-[11px] uppercase tracking-wider text-secondary-foreground group-focus-within:text-primary transition-colors">Password</Label>
						<div class="relative">
							<Lock class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-secondary-foreground" />
							<Input 
								id="password" 
								name="password" 
								type="password"
								bind:value={password}
								placeholder="••••••••" 
								required 
								class="pl-10 bg-background border-border focus:border-primary transition-all h-11"
							/>
						</div>
					</div>
					<div class="space-y-2 group">
						<Label for="confirmPassword" class="font-mono text-[11px] uppercase tracking-wider text-secondary-foreground group-focus-within:text-primary transition-colors">Konfirmasi</Label>
						<div class="relative">
							<ShieldCheck class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-secondary-foreground" />
							<Input 
								id="confirmPassword" 
								name="confirmPassword" 
								type="password"
								bind:value={confirmPassword}
								placeholder="••••••••" 
								required 
								class="pl-10 bg-background border-border focus:border-primary transition-all h-11 {!isMatching ? 'border-destructive focus:border-destructive' : ''}"
							/>
						</div>
					</div>
				</div>

				{#if !isMatching}
					<p class="text-destructive text-xs mt-1">Password tidak cocok</p>
				{/if}

				<!-- Privacy Policy / Terms -->
				<div class="flex items-start space-x-2 pt-2">
					<Checkbox id="terms" required />
					<Label for="terms" class="text-sm font-normal leading-tight text-secondary-foreground">
						Saya menyetujui <a href="/terms" class="text-primary hover:underline">Syarat & Ketentuan</a> serta Kebijakan Privasi Kios Sheza.
					</Label>
				</div>

				<!-- Submit Button -->
				<Button 
					type="submit" 
					class="w-full h-12 text-base font-tight font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all"
					disabled={!isMatching || password === ''}
				>
					DAFTAR SEKARANG
					<ArrowRight class="ml-2 size-5" />
				</Button>

				{#if form?.message}
					<p class="text-center text-sm text-destructive font-medium mt-2">{form.message}</p>
				{/if}
			</form>
		</Card.Content>
		<Card.Footer class="border-t border-border py-4 justify-center">
			<p class="text-sm text-secondary-foreground">
				Sudah memiliki akun toko? 
				<a href="/login" class="text-primary font-bold hover:underline ml-1">Masuk Sekarang</a>
			</p>
		</Card.Footer>
	</Card.Root>

	<!-- System Status Info -->
	<div class="mt-8 flex justify-center items-center space-x-4">
		<div class="flex items-center space-x-2">
			<div class="size-1.5 bg-primary rounded-full animate-pulse"></div>
			<span class="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Sistem Operasional</span>
		</div>
		<div class="size-1 bg-border rounded-full"></div>
		<span class="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">v2.4.0</span>
	</div>
</main>

<!-- Decorative Elements -->
<div class="hidden lg:block fixed -bottom-24 -right-24 size-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
<div class="hidden lg:block fixed -top-24 -left-24 size-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

<style>
	:global(body) {
		background-color: var(--background);
		color: var(--foreground);
	}
</style>
