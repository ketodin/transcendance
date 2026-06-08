<script lang="ts">
	import { resolve } from '$app/paths';
	import ThemeToggle from './ThemeToggle.svelte';
	import LanguagePicker from './LanguagePicker.svelte';
	import ProfileCard from '$lib/components/ProfileCard.svelte';
	import { friendListOpen } from '$lib/stores/sidebar';
	import { Users } from '@lucide/svelte';
	import type { User } from '$lib/server/prisma/browser';

	const { user }: { user: User } = $props();
</script>

<header class="fixed top-0 right-0 left-0 z-50 flex px-[1%] py-[1%]">
	<div class="glass flex h-16 w-full justify-between px-5">
		<div class="flex items-center gap-3">
			<button
				class="flex cursor-pointer rounded-md p-1.5 opacity-70 transition hover:bg-white/10 hover:opacity-100 lg:hidden"
				onclick={() => friendListOpen.update((v) => !v)}
				aria-label="Toggle friends list"
			>
				<Users size={20} />
			</button>
			<a href={resolve('/')} class="text-xl font-bold"> Transcendence </a>
		</div>
		<div class="flex items-center gap-2">
			<LanguagePicker />
			<ThemeToggle />
			<ProfileCard {user} />
		</div>
	</div>
</header>
