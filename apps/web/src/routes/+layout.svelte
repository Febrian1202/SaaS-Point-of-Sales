<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toaster position="top-center" />
{@render children()}
