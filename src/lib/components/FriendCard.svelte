<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Check, X } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { type Friend } from '$lib/friends';
	import * as friends from '$lib/friends.remote';
	import { resolve } from '$app/paths';
	import { toast } from '$lib/components/toast';
	import Avatar from '$lib/components/Avatar.svelte';

	type Props = { friend: Friend; online: boolean };
	let { friend, online }: Props = $props();
</script>

<a href={resolve('/profile/[id]', { id: friend.id })} class="glassdeep user">
	<Avatar {...friend} />
	<div class="info">
		<div class="name">{friend.name}</div>
		{#if friend.friendRequestStatus == 'SENT' || friend.friendRequestStatus == 'RECEIVED'}
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
		{#if friend.friendRequestStatus == 'RECEIVED'}
			<Button
				class="glass"
				variant="outline"
				size="icon-sm"
				onclick={async () => {
					await friends.accept(friend.id).then(() => toast.success(m.friend_request_accept()));
				}}><Check /></Button
			>
			<div class="separator"></div>
			<Button
				class="glass text-red-400"
				variant="outline"
				size="icon-sm"
				onclick={async () => {
					await friends.remove(friend.id).then(() => toast.success(m.friend_request_deny()));
				}}><X /></Button
			>
		{/if}
	</div>
</a>

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
