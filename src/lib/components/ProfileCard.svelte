<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import type { User } from '$lib/server/prisma/browser';
	import { Settings } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const { user }: { user: User } = $props();

	function handleCardClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('.settings-link')) return;
		void goto(resolve('/profile/[id]', { id: user.id }));
	}

	function handleCardKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			void goto(resolve('/profile/[id]', { id: user.id }));
		}
	}
</script>

<div
	class="card glassbutton"
	role="link"
	tabindex="0"
	onclick={handleCardClick}
	onkeydown={handleCardKeydown}
>
	<a href={resolve('/settings')} class="settings-link" onclick={(e) => e.stopPropagation()}>
		<Settings size={20} />
	</a>
	<span class="name"
		>{user.name && user.name.length > 12 ? user.name.slice(0, 9) + '...' : user.name}</span
	>
	<Avatar {...user} size="2.0rem" />
</div>

<style>
	.card {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
	}

	.card:hover {
		background: rgba(255, 255, 255, 0.08) !important;
	}

	.settings-link {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border-radius: 6px;
		color: inherit;
		text-decoration: none;
		opacity: 0.5;
		transition:
			opacity 0.15s,
			background 0.15s;
	}

	.settings-link:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.1);
	}

	.name {
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
	}
</style>
