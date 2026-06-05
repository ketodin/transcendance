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
	let displayName = $derived.by(() => {
		const maxLength = friend.friendRequestStatus === 'RECEIVED' ? 6 : 15;

		if (friend.name.length > maxLength) {
			return friend.name.slice(0, maxLength - 2) + '..';
		}

		return friend.name;
	});
</script>

<a
	href={resolve('/profile/[id]', { id: friend.id })}
	class="glassdeep relative mb-3 flex items-center gap-3 rounded-xl p-[0.85rem] hover:-translate-y-px"
>
	<Avatar {...friend} size="2.5rem" />

	<div>
		<div class="flex items-center gap-2">
			{displayName}
			{#if friend.friendRequestStatus == 'RECEIVED'}
				<Button
					class="glass"
					variant="outline"
					size="icon-sm"
					onclick={async (e: MouseEvent) => {
						e.preventDefault();
						await friends.accept(friend.id).then(() => toast.success(m.friend_request_accept()));
					}}><Check /></Button
				>
				<div class="h-[1.2rem] w-px bg-white/15"></div>
				<Button
					class="glass text-red-400"
					variant="outline"
					size="icon-sm"
					onclick={async (e: MouseEvent) => {
						e.preventDefault();
						await friends.remove(friend.id).then(() => toast.success(m.friend_request_deny()));
					}}><X /></Button
				>
			{/if}
		</div>

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
</a>
