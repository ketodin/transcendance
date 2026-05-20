<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Friends from '$lib/components/Friends.svelte';
	import '../app.css';

	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const isAuthRoute = $derived(
		$page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/register')
	);
</script>

<ModeWatcher />

{#if !isAuthRoute}
	<div class="app">
		<Header />
		<Friends />
		<Footer />

		<main class="game-container">
			<div class="glass content">
				{@render children?.()}
			</div>
		</main>
	</div>
{:else}
	{@render children?.()}
{/if}
