<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import Shader from '$lib/components/Shader.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import FriendList from '$lib/components/FriendList.svelte';
	import '../app.css';

	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import { shaderTheme } from '$lib/shader-theme';

	let { children }: { children: Snippet } = $props();

	const isAuthRoute = $derived(
		$page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/register')
	);
</script>

<ModeWatcher />

<Shader theme={$shaderTheme} />

{#if !isAuthRoute}
	<div class="app">
		<Header />
		<FriendList />
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
