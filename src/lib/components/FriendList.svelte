<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import FriendCard from './FriendCard.svelte';
	import * as friends from '$lib/friends.remote';

	const friendList = $derived(await friends.list());

	const statusOrder: Record<friends.FriendStatus, number> = { RECEIVED: 3, ACCEPTED: 2, SENT: 1 };
	let sortedFriends = $derived(
		[...friendList].sort((a, b) => statusOrder[b.friendStatus] - statusOrder[a.friendStatus])
	);
</script>

<div class="glass sidebar">
	<h2>{m.friends()}</h2>

	{#each sortedFriends as friend (friend.id)}
		<FriendCard {friend} online={true} />
	{/each}
</div>

<style>
	:global(:root) {
		--header-height: 4rem;
		--layout-gap: 1rem;
	}

	.sidebar h2 {
		text-align: center;
	}

	.sidebar {
		position: fixed;
		left: 1%;
		top: calc(var(--header-height) + var(--layout-gap) + 1%);
		width: 20%;
		height: calc(100vh - var(--header-height) - var(--layout-gap) - 2% - 4rem);
		display: flex;
		flex-direction: column;
		padding: 1.25rem;
		overflow-y: auto;
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		opacity: 0.6;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 0.5rem;
	}
</style>
