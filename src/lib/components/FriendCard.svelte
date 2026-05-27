<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Check, X } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as friends from '$lib/friends.remote';

	type Props = { friend: friends.Friend; online: boolean };
	let { friend, online }: Props = $props();

	const initial = $derived(friend.name.charAt(0).toUpperCase());
</script>

<div class="glassdeep user">
	<div class="avatar">{initial}</div>

	<div class="info">
		<div class="name">{friend.name}</div>
		{#if friend.friendStatus == 'SENT' || friend.friendStatus == 'RECEIVED'}
			<Badge variant="destructive" class="status offline">
				{m.pending()}
			</Badge>
		{:else if online}
			<Badge variant="secondary">{m.online()}</Badge>
		{:else}
			<Badge variant="outline" class="status offline">
				{m.offline()}
			</Badge>
		{/if}
	</div>

	<div class="actions">
		{#if friend.friendStatus == 'ACCEPTED'}
			<Button
				class="glass text-red-400"
				variant="outline"
				size="icon-sm"
				onclick={() => friends.remove(friend.id)}><X /></Button
			>
		{:else if friend.friendStatus == 'RECEIVED'}
			<Button
				class="glass"
				variant="outline"
				size="icon-sm"
				onclick={() => friends.accept(friend.id)}><Check /></Button
			>
			<div class="separator"></div>
			<Button
				class="glass text-red-400"
				variant="outline"
				size="icon-sm"
				onclick={() => friends.remove(friend.id)}><X /></Button
			>
		{/if}
	</div>
</div>

<style>
	.user {
		position: relative;

		display: flex;
		align-items: center;
		gap: 0.75rem;

		padding: 0.85rem;
		border-radius: 0.75rem;

		margin-bottom: 0.75rem;

		cursor: pointer;

		transition:
			transform 0.15s ease,
			background 0.2s ease;
	}

	.user:hover {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.06);
	}

	.avatar {
		width: 2.5rem;
		aspect-ratio: 1 / 1;
		border-radius: 50%;

		display: flex;
		align-items: center;
		justify-content: center;

		font-weight: 600;

		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.08);
		font-size: 1vw;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.name {
		font-size: 0.95rem;
		font-weight: 500;
	}

	.actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.separator {
		width: 1px;
		height: 1.2rem;
		background: rgba(255, 255, 255, 0.15);
	}
</style>
