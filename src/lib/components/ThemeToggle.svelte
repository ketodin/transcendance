<script lang="ts">
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	import { Button } from '$lib/components/ui/button/index.js';

	import { setMode } from 'mode-watcher';

	import { toggleShaderTheme, shaderTheme } from '$lib/shader-theme';

	function toggleTheme() {
		const newTheme = $shaderTheme === 'dark' ? 'light' : 'dark';

		toggleShaderTheme();

		setMode(newTheme);
	}
</script>

<Button
	onclick={toggleTheme}
	variant="outline"
	size="icon"
	class="glassbutton relative shrink-0 border-white/20 hover:bg-white/10"
>
	{#if $shaderTheme === 'dark'}
		<MoonIcon class="h-[1.2rem] w-[1.2rem] transition-all" />
	{:else}
		<SunIcon class="h-[1.2rem] w-[1.2rem] transition-all" />
	{/if}
</Button>
