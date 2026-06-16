<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { syncFromCSS } from '$lib/game/phaser/colors';

	// export function destroyAllPhaserGames() {
	// 	// Cherche tous les canvas WebGL dans le DOM et force la perte de contexte
	// 	document.querySelectorAll('canvas').forEach((canvas) => {
	// 		const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
	// 		if (gl) {
	// 			const ext = gl.getExtension('WEBGL_lose_context');
	// 			if (ext) {
	// 				ext.loseContext();
	// 				console.log('[Phaser] Canvas orphelin nettoyé :', canvas);
	// 			}
	// 		}
	// 		canvas.remove();
	// 	});

	// 	// Nettoyer le registre global
	// 	if (window.__phaserInstances) {
	// 		window.__phaserInstances.forEach((g) => {
	// 			try { if (!g.isDestroyed) g.destroy(false); } catch (_) {}
	// 		});
	// 		window.__phaserInstances = [];
	// 	}
	// }


  function forceDestroyGame(g: Game) {
        // Step 2: Stop the RAF loop so no more frames fire.
        g.loop.stop();

        // Step 1: Release the WebGL context NOW.
        // game.context is public (typed CanvasRenderingContext2D | WebGLRenderingContext).
        const gl = g.context as WebGLRenderingContext | null;
        if (gl) {
            const loseExt = gl.getExtension('WEBGL_lose_context');
            if (loseExt) {
                loseExt.loseContext();
            }
        }

        // Step 3: Run the internal destroy (scenes, renderer, canvas DOM removal).
        // runDestroy is @private in the source, so a cast is needed here.
        (g as any).removeCanvas = true;
        (g as any).runDestroy();
    }

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
			forceDestroyGame(game);
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
