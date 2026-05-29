<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Plus, X } from '@lucide/svelte';
	import FriendCard from './FriendCard.svelte';
	import * as friends from '$lib/friends.remote';
	import { send as sendFriendRequest } from '$lib/friends.remote';
	import { Input } from '$lib/components/ui/input';

	const friendList = $derived(await friends.list());

	const statusOrder: Record<friends.FriendRequestStatus, number> = { RECEIVED: 3, ACCEPTED: 2, SENT: 1 };
	let sortedFriends = $derived(
		[...friendList].sort((a, b) => statusOrder[b.friendStatus] - statusOrder[a.friendStatus])
	);
	let showAddFriend = $state(false);
</script>

<div class="glass sidebar">
	<div class="sidebar-header">
		<h2>{m.friends()}</h2>
		<button class="add-btn" onclick={() => (showAddFriend = !showAddFriend)} title="Add a friend">
			{#if showAddFriend}
				<X size={20} />
			{:else}
				<Plus size={20} />
			{/if}
		</button>
	</div>

	{#if showAddFriend}
		<form class="add-friend-form glass" {...sendFriendRequest}>
			<Input {...sendFriendRequest.fields.email.as('text')} placeholder={m.mail_place_holder()} />
			{#each sendFriendRequest.fields.email.issues() as issue (issue.message)}
				<p class="error">{issue.message}</p>
			{/each}
		</form>
	{/if}

	{#each sortedFriends as friend (friend.id)}
		<FriendCard {friend} online={true} />
	{/each}
</div>

<style>
	:global(:root) {
		--header-height: 4rem;
		--layout-gap: 1rem;
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

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		margin-bottom: 0.5rem;
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		opacity: 0.6;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.add-btn {
		position: absolute;
		right: 0;
		background: none;
		border: none;
		cursor: pointer;
		opacity: 0.5;
		padding: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		color: inherit;
		transition:
			opacity 0.2s,
			background 0.2s;
	}

	.add-btn:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.1);
	}

	.add-friend-form {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
		padding: 0.6rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.cancel-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.8rem;
		opacity: 0.5;
		color: inherit;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		transition: opacity 0.2s;
	}

	.cancel-btn:hover {
		opacity: 1;
	}

	.error {
		font-size: 0.75rem;
		color: #f87171;
	}
</style>
