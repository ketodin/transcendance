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

<a
	href={resolve('/profile/[id]', { id: friend.id })}
	class="glassdeep relative mb-3 flex cursor-pointer items-center gap-3 rounded-xl p-[0.85rem] transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-white/[0.06]"
>
	<div
		class="flex aspect-square w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/10 text-base font-semibold"
	>
		<Avatar {...friend} size="2.5rem" />
	</div>

	<div class="flex min-w-0 flex-1 flex-col gap-[0.2rem]">
		<div class="flex items-center gap-2">
			<div
				class="min-w-0 flex-1 overflow-hidden text-[0.95rem] font-medium text-ellipsis whitespace-nowrap"
			>
				{friend.name}
			</div>
			<div class="flex shrink-0 items-center gap-2">
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
