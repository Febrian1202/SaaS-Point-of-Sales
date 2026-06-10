<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Store, User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let isMatching = $derived(password === confirmPassword || confirmPassword === '');
</script>

<svelte:head>
	<title>Registrasi Toko Baru | Transa</title>
</svelte:head>

<div class="pointer-events-none fixed inset-0 z-0 opacity-20">
	<div
		class="absolute top-0 left-0 h-full w-full"
		style="background-image: radial-gradient(circle at 2px 2px, var(--border) 1px, transparent 0); background-size: 32px 32px;"
	></div>
</div>

<main
	class="relative z-10 mx-auto flex min-h-screen w-full max-w-120 animate-in flex-col justify-center px-4 py-12 duration-700 fade-in slide-in-from-bottom-4"
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
		<Card.Header class="pb-6">
			<Card.Title class="font-tight text-2xl text-foreground">Registrasi Toko</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-5">
				<!-- Nama Toko -->
				<div class="group space-y-2">
					<Label
						for="storeName"
						class="font-mono text-[11px] tracking-wider text-secondary-foreground uppercase transition-colors group-focus-within:text-primary"
						>Nama Toko</Label
					>
					<div class="relative">
						<Store
							class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
						/>
						<Input
							id="storeName"
							name="storeName"
							placeholder="Contoh: Kios Berkah Jaya"
							required
							class="h-11 border-border bg-background pl-10 transition-all focus:border-primary"
						/>
					</div>
				</div>

				<!-- Nama Pemilik -->
				<div class="group space-y-2">
					<Label
						for="userName"
						class="font-mono text-[11px] tracking-wider text-secondary-foreground uppercase transition-colors group-focus-within:text-primary"
						>Nama Pemilik</Label
					>
					<div class="relative">
						<User
							class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
						/>
						<Input
							id="userName"
							name="userName"
							placeholder="Nama Lengkap Anda"
							required
							class="h-11 border-border bg-background pl-10 transition-all focus:border-primary"
						/>
					</div>
				</div>

				<!-- Email -->
				<div class="group space-y-2">
					<Label
						for="email"
						class="font-mono text-[11px] tracking-wider text-secondary-foreground uppercase transition-colors group-focus-within:text-primary"
						>Email</Label
					>
					<div class="relative">
						<Mail
							class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
						/>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="email@bisnisanda.com"
							required
							class="h-11 border-border bg-background pl-10 transition-all focus:border-primary"
						/>
					</div>
				</div>

				<!-- Password Row -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="group space-y-2">
						<Label
							for="password"
							class="font-mono text-[11px] tracking-wider text-secondary-foreground uppercase transition-colors group-focus-within:text-primary"
							>Password</Label
						>
						<div class="relative">
							<Lock
								class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
							/>
							<Input
								id="password"
								name="password"
								type="password"
								bind:value={password}
								placeholder="••••••••"
								required
								class="h-11 border-border bg-background pl-10 transition-all focus:border-primary"
							/>
						</div>
					</div>
					<div class="group space-y-2">
						<Label
							for="confirmPassword"
							class="font-mono text-[11px] tracking-wider text-secondary-foreground uppercase transition-colors group-focus-within:text-primary"
							>Konfirmasi</Label
						>
						<div class="relative">
							<ShieldCheck
								class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
							/>
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								bind:value={confirmPassword}
								placeholder="••••••••"
								required
								class="h-11 border-border bg-background pl-10 transition-all focus:border-primary {!isMatching
									? 'border-destructive focus:border-destructive'
									: ''}"
							/>
						</div>
					</div>
				</div>

				{#if !isMatching}
					<p class="mt-1 text-xs text-destructive">Password tidak cocok</p>
				{/if}

				<!-- Privacy Policy / Terms -->
				<div class="flex items-start space-x-2 pt-2">
					<Checkbox id="terms" required />
					<Label for="terms" class="text-sm leading-tight font-normal text-secondary-foreground">
						Saya menyetujui <a href="/terms" class="text-primary hover:underline"
							>Syarat & Ketentuan</a
						> serta Kebijakan Privasi Kios Sheza.
					</Label>
				</div>

				<!-- Submit Button -->
				<Button
					type="submit"
					class="h-12 w-full rounded-md bg-primary font-tight text-base font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
					disabled={!isMatching || password === ''}
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
				<a href="/login" class="ml-1 font-bold text-primary hover:underline">Masuk Sekarang</a>
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

<!-- Decorative Elements -->
<div
	class="pointer-events-none fixed -right-24 -bottom-24 hidden size-96 rounded-full bg-primary/5 blur-[100px] lg:block"
></div>
<div
	class="pointer-events-none fixed -top-24 -left-24 hidden size-80 rounded-full bg-primary/10 blur-[120px] lg:block"
></div>

<style>
	:global(body) {
		background-color: var(--background);
		color: var(--foreground);
	}
</style>
