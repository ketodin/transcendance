<script lang="ts">
	import { resolve } from '$app/paths';
	import ThemeToggle from './ThemeToggle.svelte';
	import LanguagePicker from './LanguagePicker.svelte';
	import ProfileCard from '$lib/components/ProfileCard.svelte';
	import { Users } from '@lucide/svelte';
	import { friendListOpen } from '$lib/stores/sidebar';
</script>

<header class="pointer-events-none fixed top-0 right-0 left-0 z-50 flex px-[1%] py-[1%]">
	<div
		class="glassdeep pointer-events-auto flex h-16 w-full items-center justify-between gap-4 px-5"
	>
		<div class="flex min-w-0 items-center gap-3">
			<button
				class="flex shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-1.5 opacity-70 transition hover:bg-white/10 hover:opacity-100 lg:hidden"
				onclick={() => friendListOpen.update((v) => !v)}
				aria-label="Toggle friends list"
			>
				<Users size={20} />
			</button>
			<a
				href={resolve('/')}
				class="truncate text-xl font-bold tracking-tight md:text-3xl"
			>
				Transcendence
			</a>
		</div>
		<div class="flex items-center gap-2">
			<LanguagePicker />
			<ThemeToggle />
			<ProfileCard />
		</div>
	</div>
</header>
