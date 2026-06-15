<script lang="ts">
	import type { Room } from '@colyseus/sdk';
	import type { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';
	import type { User } from '$lib/server/prisma/browser';
	import Avatar from '$lib/components/Avatar.svelte';
	import { LoaderCircle } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';

	let { room, user }: { room: Room<GameRoomState>; user: User } = $props();

	let opponent = $state<{ name: string; image: string | null } | null>(null);
	let readySent = $state(false);
	let countdown = $state(3);

	const isPlayer0 = $derived(room.sessionId === room.state.player0Id);

	$effect(() => {
		const handler = (state: GameRoomState) => {
			if (state.player0Id && state.player1Id && !readySent) {
				readySent = true;
				opponent = {
					name: isPlayer0 ? state.player1Name : state.player0Name,
					image: (isPlayer0 ? state.player1Image : state.player0Image) || null
				};
			} else if ((!state.player0Id || !state.player1Id) && opponent) {
				opponent = null;
				readySent = false;
				countdown = 3;
			}
		};
		room.onStateChange(handler);
		return () => room?.onStateChange?.remove?.(handler);
	});

	$effect(() => {
		if (!opponent) return;
		const interval = setInterval(() => {
			countdown -= 1;
			if (countdown <= 0) {
				clearInterval(interval);
				room.send('ready');
			}
		}, 1000);
		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-col items-center gap-10">
	<p class="text-xs tracking-widest uppercase opacity-30">#{room.roomId}</p>

	<div class="flex items-stretch gap-6">
		<!-- Local player card -->
		<div
			class="glass flex min-w-40 flex-col items-center justify-center gap-3 rounded-2xl px-8 py-6"
		>
			<Avatar image={user.image ?? null} name={user.name} size="4rem" />
			<span class="max-w-28 truncate font-semibold">{user.name}</span>
		</div>

		<span class="self-center text-2xl font-bold opacity-30">VS</span>

		<!-- Opponent card -->
		<div
			class="glass flex min-w-40 flex-col items-center justify-center gap-3 rounded-2xl px-8 py-6"
		>
			{#if opponent}
				<Avatar image={opponent.image} name={opponent.name} size="4rem" />
				<span class="max-w-28 truncate font-semibold">{opponent.name}</span>
			{:else}
				<!-- Skeleton waiting state -->
				<div class="size-16 animate-pulse rounded-full bg-white/10"></div>
				<div class="h-4 w-20 animate-pulse rounded-md bg-white/10"></div>
				<div class="flex gap-1">
					<span class="size-1.5 animate-bounce rounded-full bg-white/30 [animation-delay:0ms]"
					></span>
					<span class="size-1.5 animate-bounce rounded-full bg-white/30 [animation-delay:150ms]"
					></span>
					<span class="size-1.5 animate-bounce rounded-full bg-white/30 [animation-delay:300ms]"
					></span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Bottom action area -->
	{#if opponent}
		<div class="flex flex-col items-center gap-2">
			<span class="text-sm tracking-widest uppercase opacity-40">{m.gameStartingIn()}</span>
			<span
				class="text-5xl font-bold tabular-nums transition-all duration-300"
				class:opacity-100={countdown > 0}
				class:opacity-0={countdown <= 0}
			>
				{countdown}
			</span>
			<LoaderCircle class="size-5 animate-spin opacity-40" />
		</div>
	{:else}
		<span class="text-sm tracking-widest uppercase opacity-40">{m.search_matchmaking()}</span>
		<a
			href={resolve('/')}
			class="glassbutton px-10 py-4 text-sm font-semibold tracking-widest uppercase opacity-60 hover:opacity-100"
		>
			{m.cancel()}
		</a>
	{/if}
</div>
