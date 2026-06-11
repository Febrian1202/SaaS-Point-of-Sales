<script lang="ts">
	import { Search, Bell, Settings, LogOut, User as UserIcon } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { base } from '$app/paths';
	import { enhance } from '$app/forms';

	let { user } = $props();
</script>

<header
	class="fixed top-0 right-0 left-64 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-8"
>
	<!-- Context Title -->
	<div class="flex items-center gap-4">
		<h2 class="font-tight text-lg font-semibold text-foreground">Kios Sheza POS</h2>
	</div>

	<!-- Search & Actions -->
	<div class="flex flex-1 items-center justify-end gap-6">
		<!-- Search Field (Using Shadcn Input) -->
		<div class="relative w-full max-w-xs">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				class="w-full border-border bg-card pr-4 pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0"
				placeholder="Cari produk..."
				type="text"
			/>
		</div>

		<!-- Action Buttons (Using Shadcn Button with Ghost variant) -->
		<div class="flex items-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				class="size-10 text-muted-foreground hover:bg-border/50 hover:text-foreground"
			>
				<Bell class="size-5" />
			</Button>

			<Button
				variant="ghost"
				size="icon"
				class="size-10 text-muted-foreground hover:bg-border/50 hover:text-foreground"
			>
				<Settings class="size-5" />
			</Button>

			<!-- User Profile Dropdown (Shadcn UI) -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="outline-none">
					<Avatar.Root
						class="size-9 cursor-pointer border border-border transition-opacity hover:opacity-90"
					>
						<Avatar.Image
							src="https://lh3.googleusercontent.com/aida-public/AB6AXuA83ioHC1nWhmUUUTuBI-0wap1OSU8ko4YqSGdV7LWgHJ9mC9Jx2AxgBrO1F8HyOBC7LNMM04kb-iQ46BlfKTZvkl8qLZDL3rIsNCb-t8Zf8TY2ANnUtBwhnoPn7skTetTw1w08K5q4_M3Xy5Wdtqob6qriXpfWmYuaRLB6nilI1AxCnewtMb4Gzemzit70OWCUzW8a4BH8CsvuqdcQbYiRb3tp2kyoKtaEINRG1IPC-TXPDTRGMjrPvfQVjAZt2PFsiM86i_-Lag"
							alt={user?.name || 'User'}
						/>
						<Avatar.Fallback class="bg-border font-mono text-xs text-foreground uppercase">
							{user?.name?.substring(0, 2) || 'US'}
						</Avatar.Fallback>
					</Avatar.Root>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-56 border-border bg-card">
					<DropdownMenu.Label
						class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
						>Akun Saya</DropdownMenu.Label
					>
					<DropdownMenu.Separator class="bg-border" />
					<DropdownMenu.Item class="cursor-pointer focus:bg-border focus:text-foreground">
						<UserIcon class="mr-2 size-4" />
						Profil Saya
					</DropdownMenu.Item>
					<DropdownMenu.Item class="cursor-pointer focus:bg-border focus:text-foreground">
						<Settings class="mr-2 size-4" />
						Pengaturan
					</DropdownMenu.Item>
					<DropdownMenu.Separator class="bg-border" />

					<!-- Form Logout Native SvelteKit -->
					<form
						id="logout-form"
						method="POST"
						action="{base}/logout"
						class="hidden"
						use:enhance
					></form>
					<DropdownMenu.Item
						variant="destructive"
						class="cursor-pointer"
						onclick={() => {
							const form = document.getElementById('logout-form') as HTMLFormElement;
							form?.requestSubmit();
						}}
					>
						<LogOut class="mr-2 size-4" />
						Keluar
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>
</header>
