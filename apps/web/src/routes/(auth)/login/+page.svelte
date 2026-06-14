<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Store, Mail, Lock, LogIn, ArrowRight, Eye, EyeClosed } from 'lucide-svelte';
	import { slide, scale } from 'svelte/transition';
	import type { ActionData } from './$types';
	import { loginSchema } from '$lib/schemas';
	import { base } from '$app/paths';

	let { form }: { form: ActionData } = $props();

	// State form input reaktif Svelte 5
	let email = $state('');
	let password = $state('');

	// State visible pasword
	let isVisiblePassword = $state(false);

	// State error reaktif untuk validasi Zod
	let errors = $state<{ email?: string; password?: string }>({});

	// Fungsi validasi real-time per kolom saat mengetik
	function validateField(field: 'email' | 'password') {
		const result = loginSchema.safeParse({ email, password });
		if (result.success) {
			errors[field] = undefined;
		} else {
			const fieldErrors = result.error.flatten().fieldErrors;
			errors[field] = fieldErrors[field]?.[0];
		}
	}

	// Submit handler yang terintegrasi dengan SvelteKit progressive enhancement
	const handleEnhance: SubmitFunction = ({ cancel }) => {
		const result = loginSchema.safeParse({ email, password });
		if (!result.success) {
			cancel(); // Batalkan pengiriman ke server
			const fieldErrors = result.error.flatten().fieldErrors;
			errors = {
				email: fieldErrors.email?.[0],
				password: fieldErrors.password?.[0]
			};
		}
	};
</script>

<svelte:head>
	<title>Masuk | Transa</title>
</svelte:head>

<main
	class="relative z-10 mx-auto flex min-h-screen w-full max-w-115 animate-in flex-col justify-center px-4 py-12 duration-700 fade-in slide-in-from-bottom-4"
>
	<!-- Brand Identity -->
	<div class="mb-10 flex flex-col items-center text-center">
		<div
			class="mb-4 flex size-16 items-center justify-center rounded-md bg-primary shadow-[0_0_30px_rgba(180,255,57,0.2)]"
		>
			<Store class="size-8 text-primary-foreground" />
		</div>
		<h1 class="mb-1 font-tight text-4xl font-semibold tracking-tight text-foreground">Transa</h1>
		<p class="font-sans text-secondary-foreground">Kelola bisnis Anda dengan lebih cerdas.</p>
	</div>

	<!-- Login Card -->
	<Card.Root class="overflow-hidden rounded-lg border-border bg-card shadow-2xl">
		<Card.Header class="pb-6 text-center">
			<Card.Title class="font-tight text-2xl tracking-tight text-foreground"
				>Selamat Datang Kembali</Card.Title
			>
			<Card.Description class="text-secondary-foreground"
				>Silakan masuk ke akun Anda</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance={handleEnhance} novalidate class="space-y-5">
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
						<p transition:slide={{ duration: 200 }} class="mt-1 text-xs text-destructive">{errors.email}</p>
					{/if}
				</div>

				<!-- Password -->
				<div class="group space-y-2">
					<div class="flex items-center justify-between">
						<Label
							for="password"
							class="font-mono text-[11px] tracking-wider uppercase transition-colors group-focus-within:text-primary {errors.password
								? 'text-destructive'
								: 'text-secondary-foreground'}">Password</Label
						>
						<a
							href="{base}/forgot-password"
							class="font-mono text-[11px] font-bold tracking-wider text-primary uppercase hover:underline"
							>Lupa?</a
						>
					</div>
					<div class="relative">
						<Lock
							class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-secondary-foreground"
						/>
						<Input
							id="password"
							name="password"
							type={isVisiblePassword ? 'text' : 'password'}
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
							class="absolute top-1/2 right-5 flex size-5 -translate-y-1/2 items-center justify-center text-secondary-foreground"
							onclick={() => (isVisiblePassword = !isVisiblePassword)}
						>
							{#if isVisiblePassword}
								<div in:scale={{ duration: 200, start: 0.5 }} out:scale={{ duration: 200, start: 0.5 }} class="absolute">
									<EyeClosed />
								</div>
							{:else}
								<div in:scale={{ duration: 200, start: 0.5 }} out:scale={{ duration: 200, start: 0.5 }} class="absolute">
									<Eye />
								</div>
							{/if}
						</button>
					</div>
					{#if errors.password}
						<p transition:slide={{ duration: 200 }} class="mt-1 text-xs text-destructive">{errors.password}</p>
					{/if}
				</div>

				<!-- Submit Button -->
				<Button
					type="submit"
					class="h-12 w-full rounded-md bg-primary font-tight text-base font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
				>
					MASUK SEKARANG
					<LogIn class="ml-2 size-5" />
				</Button>

				{#if form?.message}
					<p transition:slide={{ duration: 200 }} class="mt-2 text-center text-sm font-medium text-destructive">{form.message}</p>
				{/if}
			</form>
		</Card.Content>
		<Card.Footer class="justify-center border-t border-border py-4">
			<p class="text-sm text-secondary-foreground">
				Belum punya akun toko?
				<a
					href="{base}/register"
					class="ml-1 inline-flex items-center font-bold text-primary hover:underline"
				>
					Daftar Baru
					<ArrowRight class="ml-1 size-3" />
				</a>
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
