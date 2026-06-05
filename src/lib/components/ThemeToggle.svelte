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
	class="glassbutton flex h-9 w-9 items-center justify-center active:scale-95"
>
	{#if $shaderTheme === 'dark'}
		<MoonIcon size="20px" />
	{:else}
		<SunIcon size="20px" />
	{/if}
</button>
