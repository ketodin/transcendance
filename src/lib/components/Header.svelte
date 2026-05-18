<script lang="ts">
	import { resolve } from '$app/paths';
	import ThemeToggle from './ThemeToggle.svelte';
	import LanguagePicker from './LanguagePicker.svelte';
</script>

<header class="fixed top-0 left-0 right-0 z-50 flex pt-[1%] px-[1%] pointer-events-none">
	<div
		class="pointer-events-auto flex h-14 items-center justify-between gap-4 px-5 w-full"
		style="
			background: rgba(var(--color-background), 0.4);
			backdrop-filter: blur(16px);
			border-radius: var(--radius-2xl);
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
			border: 1px solid rgba(255, 255, 255, 0.4);
		"
	>
		<a href={resolve('/')} class="shrink-0 text-xl font-bold tracking-tight">
			Transcendence
		</a>

		<div class="flex items-center gap-2">
			<LanguagePicker />
			<div class="bg-white/20 h-5 w-px"></div>
			<ThemeToggle />
		</div>
	</div>
</header>
