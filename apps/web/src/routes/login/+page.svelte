<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Store, Mail, Lock, LogIn, ArrowRight } from 'lucide-svelte';
	import type { PageProps, ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Masuk | Kios Sheza</title>
</svelte:head>

<div class="fixed inset-0 pointer-events-none opacity-20 z-0">
	<div class="absolute top-0 left-0 w-full h-full" style="background-image: radial-gradient(circle at 2px 2px, var(--border) 1px, transparent 0); background-size: 32px 32px;"></div>
</div>

<main class="relative z-10 w-full max-w-105 mx-auto py-24 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
	<!-- Brand Identity -->
	<div class="flex flex-col items-center mb-10 text-center">
		<div class="size-16 bg-primary rounded-md flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(180,255,57,0.2)]">
			<Store class="size-8 text-primary-foreground" />
		</div>
		<h1 class="font-tight text-4xl text-foreground font-semibold mb-1 tracking-tight">Kios Sheza</h1>
		<p class="font-sans text-secondary-foreground">Kelola bisnis Anda dengan lebih cerdas.</p>
	</div>

	<!-- Login Card -->
	<Card.Root class="border-border bg-card shadow-2xl overflow-hidden rounded-lg">
		<Card.Header class="pb-6 text-center">
			<Card.Title class="font-tight text-2xl text-foreground tracking-tight">Selamat Datang Kembali</Card.Title>
			<Card.Description class="text-secondary-foreground">Silakan masuk ke akun Anda</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-5">
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

				<!-- Password -->
				<div class="space-y-2 group">
					<div class="flex justify-between items-center">
						<Label for="password" class="font-mono text-[11px] uppercase tracking-wider text-secondary-foreground group-focus-within:text-primary transition-colors">Password</Label>
						<a href="/forgot-password" class="text-[11px] text-primary hover:underline font-mono uppercase tracking-wider font-bold">Lupa?</a>
					</div>
					<div class="relative">
						<Lock class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-secondary-foreground" />
						<Input 
							id="password" 
							name="password" 
							type="password"
							placeholder="••••••••" 
							required 
							class="pl-10 bg-background border-border focus:border-primary transition-all h-11"
						/>
					</div>
				</div>

				<!-- Submit Button -->
				<Button 
					type="submit" 
					class="w-full h-12 text-base font-tight font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all"
				>
					MASUK SEKARANG
					<LogIn class="ml-2 size-5" />
				</Button>

				{#if form?.message}
					<p class="text-center text-sm text-destructive font-medium mt-2">{form.message}</p>
				{/if}
			</form>
		</Card.Content>
		<Card.Footer class="border-t border-border py-4 justify-center">
			<p class="text-sm text-secondary-foreground">
				Belum punya akun toko? 
				<a href="/register" class="text-primary font-bold hover:underline ml-1 inline-flex items-center">
					Daftar Baru
					<ArrowRight class="ml-1 size-3" />
				</a>
			</p>
		</Card.Footer>
	</Card.Root>
</main>

<style>
	:global(body) {
		background-color: var(--background);
		color: var(--foreground);
	}
</style>
