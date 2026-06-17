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
	class="glassbutton flex items-center gap-2 px-2.5 py-1.5 hover:!bg-white/[0.08]"
	role="link"
	tabindex="0"
	onclick={handleCardClick}
	onkeydown={handleCardKeydown}
>
	<a
		href={resolve('/settings')}
		class="flex items-center justify-center rounded-[6px] p-1 text-inherit no-underline opacity-50 transition duration-150 hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
	>
		<Settings size={20} />
	</a>
	<span class="hidden text-[13px] font-semibold whitespace-nowrap md:inline lg:inline">
		<div class:fade-end={user.name.length > 15}>{user.name.slice(0, 15)}</div>
	</span>
	<Avatar {...user} size="2.0rem" />
</div>

<style>
	.fade-end {
		white-space: nowrap;
		overflow: hidden;

		mask-image: linear-gradient(to right, black 0%, black 80%, transparent 100%);
	}
</style>
