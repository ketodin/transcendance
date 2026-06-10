<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
</script>

<div
	id="app-footer"
	class="glass fixed bottom-0 left-0 flex w-full justify-center gap-8 !rounded-none px-4 py-[0.4rem]"
>
	<a
		href={resolve('/legal/privacy')}
		class="text-[0.7rem] whitespace-nowrap no-underline opacity-70 transition duration-200 hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
	>
		{m.privacy()}
	</a>
	<a
		href={resolve('/legal/terms')}
		class="text-[0.7rem] whitespace-nowrap no-underline opacity-70 transition duration-200 hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
	>
		{m.terms()}
	</a>
</div>

<style>
	:global(:root) {
		--footer-height: 2rem;
	}
</style>
