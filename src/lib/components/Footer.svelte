<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
</script>

<div class="glass fixed bottom-0 left-0 w-full flex justify-center gap-8 px-4 py-[0.4rem] !rounded-none">
	<a
		href={resolve('/legal/privacy')}
		class="text-[0.7rem] no-underline whitespace-nowrap transition-colors duration-200 hover:text-white"
	>
		{m.privacy()}
	</a>
	<a
		href={resolve('/legal/terms')}
		class="text-[0.7rem] no-underline whitespace-nowrap transition-colors duration-200 hover:text-white"
	>
		{m.terms()}
	</a>
</div>

<style>
	:global(:root) {
		--footer-height: 2rem;
	}
</style>
