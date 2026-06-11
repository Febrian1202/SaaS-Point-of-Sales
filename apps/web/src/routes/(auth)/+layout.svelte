<script lang="ts">
	let { children } = $props();
</script>

<div class="pointer-events-none fixed inset-0 z-0 opacity-20">
	<div
		class="absolute top-0 left-0 h-full w-full"
		style="background-image: radial-gradient(circle at 2px 2px, var(--border) 1px, transparent 0); background-size: 32px 32px;"
	></div>
</div>

<!-- Decorative Elements -->
<div
	class="animate-float-1 pointer-events-none fixed -right-24 -bottom-24 hidden size-96 rounded-full bg-primary/15 blur-[90px] lg:block"
></div>
<div
	class="animate-float-2 pointer-events-none fixed -top-24 -left-24 hidden size-80 rounded-full bg-primary/20 blur-[100px] lg:block"
></div>

{@render children()}

<style>
	:global(body) {
		background-color: var(--background);
		color: var(--foreground);
	}

	@keyframes float-slow {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(-120px, 80px) scale(1.25);
		}
	}

	@keyframes float-slow-reverse {
		0%,
		100% {
			transform: translate(0, 0) scale(1.25);
		}
		50% {
			transform: translate(100px, -90px) scale(0.85);
		}
	}

	.animate-float-1 {
		animation: float-slow 8s ease-in-out infinite;
	}

	.animate-float-2 {
		animation: float-slow-reverse 10s ease-in-out infinite;
	}
</style>
