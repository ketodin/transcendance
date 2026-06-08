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
		class="settings-link flex items-center justify-center rounded-[6px] p-1 text-inherit no-underline opacity-50 transition-[opacity,background-color] duration-150 hover:bg-white/10 hover:opacity-100"
	>
		<Settings size={20} />
	</a>
	<span class="hidden text-[13px] font-semibold whitespace-nowrap lg:inline">
		{user.name && user.name.length > 12 ? user.name.slice(0, 9) + '...' : user.name}
	</span>
	<Avatar {...user} size="2.0rem" />
</div>
