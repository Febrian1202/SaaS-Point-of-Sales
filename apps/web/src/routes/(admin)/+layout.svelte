<script lang="ts">
	import SideBar from '$lib/components/layout/admin/SideBar.svelte';
	import TopBar from '$lib/components/layout/admin/TopBar.svelte';

	let { data, children } = $props();
</script>

<div class="min-h-screen bg-background font-sans text-foreground antialiased">
	<!-- Sidebar (Fixed Left) -->
	<SideBar user={data.user} />

	<!-- Main Content Wrapper (Shifted Right) -->
	<div class="ml-64 flex min-h-screen flex-col">
		<!-- Topbar (Fixed Top) -->
		<TopBar user={data.user} />

		<!-- Main Content (Renders child pages) -->
		<main class="flex-1 px-8 pt-24 pb-8">
			{@render children()}
		</main>
	</div>
</div>
