<script lang="ts">
	import { useSession } from '$lib/auth-client';
	import { Settings } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const session = useSession();

	function handleCardClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('.settings-link')) return;
		void goto(resolve('/profile/[id]', { id: $session.data!.user.id }));
	}

	function handleCardKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			void goto(resolve('/profile/[id]', { id: $session.data!.user.id }));
		}
	}
</script>

{#if $session.data}
	{@const user = $session.data.user}
	<div
		class="glassbutton flex items-center gap-2 px-2.5 py-1.5 hover:!bg-white/[0.08] cursor-pointer"
		role="link"
		tabindex="0"
		onclick={handleCardClick}
		onkeydown={handleCardKeydown}
	>
		<a
			href={resolve('/settings')}
			class="settings-link flex items-center justify-center p-1 rounded-[6px] text-inherit no-underline opacity-50 transition-[opacity,background-color] duration-150 hover:opacity-100 hover:bg-white/10"
			onclick={(e) => e.stopPropagation()}
		>
			<Settings size={20} />
		</a>
		<span class="hidden lg:inline text-[13px] font-semibold whitespace-nowrap">
			{user.name && user.name.length > 12 ? user.name.slice(0, 9) + '...' : user.name}
		</span>
		<div class="w-7 h-7 rounded-full overflow-hidden shrink-0 border-2 border-white/20">
			{#if user.image}
				<img src={user.image} alt="avatar" class="w-full h-full object-cover" />
			{:else}
				<div class="w-full h-full flex items-center justify-center text-xs font-bold bg-white/10">
					{user.name?.charAt(0)?.toUpperCase() ?? '?'}
				</div>
			{/if}
		</div>
	</div>
{/if}
