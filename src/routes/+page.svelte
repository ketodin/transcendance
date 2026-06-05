<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex min-h-full flex-col items-center justify-center gap-6 p-8">
	<span class="text-xs uppercase tracking-[0.3em] opacity-30">{data.user.name}</span>
	<a href={resolve('/game')} class="play-cta glassbutton flex items-center justify-center px-20 py-12 text-6xl font-black uppercase tracking-widest">
		Play
	</a>
</div>

<style>
	.play-cta {
		animation: breathe 4s ease-in-out infinite;
	}

	@keyframes breathe {
		0%,
		100% {
			box-shadow:
				0 4px 16px rgba(0, 0, 0, 0.25),
				inset 0 1px 0 rgba(255, 255, 255, 0.12);
		}
		50% {
			box-shadow:
				0 8px 48px rgba(255, 255, 255, 0.1),
				0 0 80px rgba(255, 255, 255, 0.04),
				inset 0 1px 0 rgba(255, 255, 255, 0.2);
		}
	}
</style>
