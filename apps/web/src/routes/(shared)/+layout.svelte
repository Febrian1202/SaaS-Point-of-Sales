<script lang="ts">
	import SideBar from '$lib/components/layout/cashier/SideBar.svelte';
	import TopBar from '$lib/components/layout/cashier/TopBar.svelte';

	let { data, children } = $props();
	let user = $derived(data.user);
</script>

<div class="min-h-screen bg-background font-sans text-foreground antialiased">
	<SideBar {user} />
	<div class="ml-64 flex min-h-screen flex-col">
		<TopBar {user} />
		<main class="flex-1 px-8 pt-24 pb-8">
			{@render children()}
		</main>
	</div>
</div>
