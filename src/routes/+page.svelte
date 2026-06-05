<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex min-h-full flex-col items-center justify-center gap-6 p-8">
	<span class="text-xs uppercase tracking-[0.3em] opacity-30">{data.user.name}</span>
	<a href={resolve('/game')} class="play-cta glassbutton flex items-center justify-center px-20 py-12 text-6xl font-black uppercase tracking-widest">
		{m.play()}
	</a>
</div>

<style>
</style>
