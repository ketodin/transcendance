<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
	import Avatar from '$lib/components/Avatar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Settings } from '@lucide/svelte';
	import * as friends from '$lib/friends.remote';
	import { toast } from '$lib/components/toast';

	const { data }: PageProps = $props();
	import { getLocale } from '$lib/paraglide/runtime';

	const formattedDate = $derived(
		new Intl.DateTimeFormat(getLocale(), {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(data.userProfile.createdAt))
	);

	const friendList = $derived(await friends.list());

	const isFriend = $derived(
		friendList.some(
			(friend) => data.userProfile.id === friend.id && friend.friendRequestStatus === 'ACCEPTED'
		)
	);

	type UserType = 'self' | 'friend' | 'someone';
	const userType: UserType = $derived(
		data.user!.id === data.userProfile.id ? 'self' : isFriend ? 'friend' : 'someone'
	);
</script>

<div class="glass h-full w-full p-6">
	<div class="glass header p-6">
		<div class="avatar">
			<Avatar {...data.userProfile} size="100%" />
		</div>
		<div class="info p-8">
			<p class="name">{data.userProfile.name}</p>
			<p class="botinfo">{m.joined_on({ date: formattedDate })}</p>
		</div>
		<div class="action">
			{#if userType === 'self'}
				<Button href={resolve('/settings')} class="glassbutton" variant="outline">
					{m.settings()}
					<Settings size={20} />
				</Button>
			{:else if userType === 'friend'}
				<Button
					onclick={async () => {
						await friends.remove(data.userProfile.id).then(() => toast.success(m.removed_friend()));
					}}
					class="glassbutton"
					variant="outline"
				>
					<p>{m.remove_friend()}</p>
				</Button>
				<Button
					onclick={() => toast.success(m.game_invite_sent())}
					class="glassbutton"
					variant="outline"
				>
					{m.invite_play()}
				</Button>
			{:else if userType === 'someone'}
				<Button
					onclick={async () => {
						await friends
							.accept(data.userProfile.id)
							.then(() => toast.success(m.friend_request_sent()));
					}}
					class="glassbutton"
					variant="outline"
				>
					{m.add_friend()}
				</Button>
			{/if}
		</div>
	</div>
</div>

<style>
	.avatar {
		width: 15%;
		font-size: 3vw;
		border-radius: 50%;
		margin: 1vw;
	}

	.header {
		display: flex;
		flex-direction: row;
		align-items: stretch;
	}

	.info {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		flex: 1;
	}

	.name {
		font-size: 3vw;
	}

	.botinfo {
		font-size: 1vw;
		opacity: 0.7;
	}

	.action {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
		}
		.avatar {
			width: 30%;
			margin: 0;
			font-size: 8vw;
		}
		.info {
			align-items: center;
			min-height: unset;
			gap: 0.4rem;
			padding: 0;
		}
		.name {
			font-size: 6vw;
		}
		.botinfo {
			font-size: 3vw;
		}
		.action {
			width: 100%;
		}
	}
</style>
