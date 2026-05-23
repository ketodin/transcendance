<script lang="ts">
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toggleShaderTheme, shaderTheme } from '$lib/shader-theme';
</script>

<Button
	onclick={toggleShaderTheme}
	variant="outline"
	size="icon"
	class="glass relative shrink-0 border-white/20 hover:bg-white/10"
>
	{#if $shaderTheme === 'dark'}
		<MoonIcon class="h-[1.2rem] w-[1.2rem] transition-all" />
	{:else}
		<SunIcon class="h-[1.2rem] w-[1.2rem] transition-all" />
	{/if}
</Button>
