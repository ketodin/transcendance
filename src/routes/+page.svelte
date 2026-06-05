<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';
	import { colyseusClient } from '$lib/colyseusClient';
	import { pendingGameRoom, type GameStartData } from '$lib/game-room-store';
	import type { PageProps } from './$types';
	import { Loader2 } from '@lucide/svelte';
	import type { Room } from '@colyseus/sdk';
	import type { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';

	let { data }: PageProps = $props();

	let searching = $state(false);
	let room: Room<GameRoomState> | null = null;

	async function startPublicGame() {
		if (!colyseusClient) return;
		searching = true;
		try {
			room = await colyseusClient.joinOrCreate<GameRoomState>('tank_room');
			room.onMessage('game_start', (gameStartData: GameStartData) => {
				pendingGameRoom.set({ room: room!, gameStartData });
				goto('/game');
			});
			room.onLeave.once(() => {
				searching = false;
				room = null;
			});
		} catch {
			searching = false;
			room = null;
		}
	}

	async function cancelSearch() {
		searching = false;
		if (room) {
			await room.leave();
			room = null;
		}
	}
</script>

<div class="flex min-h-full flex-col items-center justify-center gap-6 p-8">
	<span class="text-xs tracking-[0.3em] uppercase opacity-30">{data.user.name}</span>

	{#if searching}
		<div class="flex flex-col items-center gap-6">
			<Loader2 class="size-16 animate-spin opacity-80" />
			<span class="text-2xl font-semibold tracking-widest uppercase opacity-80">
				{m.search_matchmaking()}
			</span>
			<button
				onclick={cancelSearch}
				class="glassbutton px-10 py-4 text-sm font-semibold tracking-widest uppercase opacity-60 hover:opacity-100"
			>
				{m.cancel()}
			</button>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-4">
			<button
				onclick={startPublicGame}
				class="play-cta glassbutton flex items-center justify-center px-20 py-12 text-6xl font-black tracking-widest uppercase"
			>
				{m.public_game()}
			</button>
			<button
				disabled
				class="glassbutton flex items-center justify-center px-16 py-6 text-2xl font-bold tracking-widest uppercase opacity-30"
			>
				{m.private_game()}
			</button>
		</div>
	{/if}
</div>
