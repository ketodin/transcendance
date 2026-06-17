<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { syncFromCSS } from '$lib/game/phaser/colors';

	onMount(() => {
		let game: import('phaser').Game | null = null;
		let observer: MutationObserver | undefined;

		void (async () => {
			const { default: StartLobbyGame } = await import('$lib/game/phaser/lobbyGame');
			const { EventBus } = await import('$lib/game/phaser/EventBus');

			syncFromCSS();
			game = StartLobbyGame('lobby-canvas');

			observer = new MutationObserver(() => {
				syncFromCSS();
				EventBus.emit('theme-changed');
			});
			observer.observe(document.documentElement, { attributeFilter: ['class'] });
		})();

		return () => {
			observer?.disconnect();
			game?.destroy(true);
		};
	});
</script>

<div class="relative h-full w-full overflow-hidden rounded-xl">
	<div id="lobby-canvas" class="pointer-events-none absolute blur-xs"></div>

	<div class="absolute inset-0 z-10 mt-20 flex flex-col items-center justify-start gap-6">
		<div class="flex flex-col items-center gap-4">
			<a
				href={resolve('/game')}
				class="play-cta glassbutton flex items-center justify-center px-8 py-8 text-4xl font-black tracking-widest uppercase sm:px-14 sm:py-10 sm:text-5xl lg:px-20 lg:py-12 lg:text-6xl"
			>
				{m.public_game()}
			</a>
			<form method="POST" action="?/newPrivateGame" use:enhance>
				<button
					type="submit"
					class="glassbutton flex items-center justify-center px-6 py-4 text-lg font-bold tracking-widest uppercase sm:px-10 sm:py-5 sm:text-xl lg:px-16 lg:py-6 lg:text-2xl"
				>
					{m.private_game()}
				</button>
			</form>
		</div>
	</div>
</div>
