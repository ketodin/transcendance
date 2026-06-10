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

{#if $shaderTheme === 'dark'}
	<button
		onclick={toggleTheme}
		class="cursor-pointer items-center justify-center opacity-70 transition hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] active:scale-95"
	>
		<MoonIcon size="20px" />
	</button>
{:else}
	<button
		onclick={toggleTheme}
		class="cursor-pointer items-center justify-center opacity-70 transition hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] active:scale-95"
	>
		<SunIcon size="20px" />
	</button>
{/if}
