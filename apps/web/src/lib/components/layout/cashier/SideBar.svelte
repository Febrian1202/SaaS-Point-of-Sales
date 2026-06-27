<script lang="ts">
	import { page } from '$app/state';
	import { LayoutDashboard, ShoppingCart, Receipt, Landmark, User } from 'lucide-svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { base } from '$app/paths';

	let { user } = $props();

	const isActive = (path: string) => {
		const currentPath = page.url.pathname;
		return currentPath === path || currentPath.startsWith(path + '/');
	};

	const menuItems = [
		{ name: 'Dasbor', path: '/dashboard', icon: LayoutDashboard },
		{ name: 'Kasir (POS)', path: '/pos', icon: ShoppingCart },
		{ name: 'Riwayat Transaksi', path: '/transactions', icon: Receipt },
		{ name: 'BRI Link', path: '/brilink', icon: Landmark },
		{ name: 'Profil Saya', path: '/profile', icon: User }
	];
</script>

<aside
	class="fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card px-4 py-6"
>
	<!-- Brand Identity (Graphite Theme) -->
	<div class="mb-8 px-2">
		<h1 class="font-tight text-2xl leading-tight font-semibold text-primary">Transa</h1>
		<p class="mt-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Kasir</p>
	</div>

	<!-- Navigation Menu -->
	<nav class="flex-1 space-y-1.5">
		{#each menuItems as item (item.path)}
			{@const active = isActive(item.path)}
			<a
				class="flex items-center gap-3 rounded-md px-3 py-2 font-sans text-sm transition-all duration-150 active:scale-[0.98] {active
					? 'bg-primary/5 font-semibold text-primary'
					: 'text-muted-foreground hover:bg-border/50 hover:text-foreground'}"
				href="{base}{item.path}"
			>
				<item.icon class="size-4" />
				<span>{item.name}</span>
			</a>
		{/each}
	</nav>

	<!-- User Profile Box (Inset Background) -->
	<div class="mt-auto rounded-xl border border-border bg-background p-3">
		<div class="flex items-center gap-3">
			<Avatar.Root class="size-10 border border-border">
				<Avatar.Image
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuA83ioHC1nWhmUUUTuBI-0wap1OSU8ko4YqSGdV7LWgHJ9mC9Jx2AxgBrO1F8HyOBC7LNMM04kb-iQ46BlfKTZvkl8qLZDL3rIsNCb-t8Zf8TY2ANnUtBwhnoPn7skTetTw1w08K5q4_M3Xy5Wdtqob6qriXpfWmYuaRLB6nilI1AxCnewtMb4Gzemzit70OWCUzW8a4BH8CsvuqdcQbYiRb3tp2kyoKtaEINRG1IPC-TXPDTRGMjrPvfQVjAZt2PFsiM86i_-Lag"
					alt={user?.name || 'User'}
				/>
				<Avatar.Fallback class="bg-border font-mono text-xs text-foreground uppercase">
					{user?.name?.substring(0, 2) || 'US'}
				</Avatar.Fallback>
			</Avatar.Root>
			<div class="overflow-hidden">
				<p class="truncate font-mono text-xs font-bold text-foreground">{user?.name || 'User'}</p>
				<p class="mt-0.5 text-[10px] text-muted-foreground capitalize">{user?.role || 'User'}</p>
			</div>
		</div>
	</div>
</aside>
