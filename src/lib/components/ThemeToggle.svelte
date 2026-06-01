<script lang="ts">
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	import { setMode } from 'mode-watcher';

	import { toggleShaderTheme, shaderTheme } from '$lib/shader-theme';

	function toggleTheme() {
		const newTheme = $shaderTheme === 'dark' ? 'light' : 'dark';

		toggleShaderTheme();

		setMode(newTheme);
	}
</script>

<button
	onclick={toggleTheme}
	class="glassbutton flex h-9 w-9 items-center justify-center text-lg transition hover:bg-white/10 active:scale-95"
>
	{#if $shaderTheme === 'dark'}
		<MoonIcon class="h-[1.2rem] w-[1.2rem] transition-all" />
	{:else}
		<SunIcon class="h-[1.2rem] w-[1.2rem] transition-all" />
	{/if}
</button>
