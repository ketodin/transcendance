<script lang="ts">
	import { resolve } from '$app/paths';
	import ThemeToggle from './ThemeToggle.svelte';
	import LanguagePicker from './LanguagePicker.svelte';
</script>

<header class="pointer-events-none fixed top-0 right-0 left-0 z-50 flex px-[1%] py-[1%]">
	<div class="glass pointer-events-auto flex h-14 w-full items-center justify-between gap-4 px-5">
		<a href={resolve('/')} class="shrink-0 text-xl font-bold tracking-tight"> Transcendence </a>
		<div class="flex items-center gap-2">
			<LanguagePicker />
			<div class="h-5 w-px bg-white/20"></div>
			<ThemeToggle />
		</div>
	</div>
</header>
