<script lang="ts">
	import { getLocale, setLocale } from '$lib/paraglide/runtime';

	const languages = [
		{ code: 'fr', flag: '🇫🇷', label: 'Français' },
		{ code: 'en', flag: '🇬🇧', label: 'English' },
		{ code: 'es', flag: '🇪🇸', label: 'Español' }
	] as const;

	type Locale = (typeof languages)[number]['code'];

	let current = $state(getLocale() satisfies Locale);
	let open = $state(false);

	function selectLanguage(code: Locale) {
		current = code;
		void setLocale(current);
		open = false;
	}

	const currentLang = $derived(languages.find((l) => l.code === current) ?? languages[0]);

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.lang-picker')) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="lang-picker relative">
	<button
		onclick={() => (open = !open)}
		class="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all duration-200 hover:bg-white/10 active:scale-95"
	>
		{currentLang.flag}
	</button>

	{#if open}
		<div
			class="absolute top-full right-0 mt-2 flex flex-col gap-1 p-1.5 min-w-[140px]"
			style="
				background: rgba(255, 255, 255, 0.08);
				backdrop-filter: blur(16px);
				-webkit-backdrop-filter: blur(16px);
				border-radius: 1rem;
				box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
				border: 1px solid rgba(255, 255, 255, 0.18);
			"
		>
			{#each languages as lang (lang.code)}
				<button
					onclick={() => selectLanguage(lang.code)}
					class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150
						{lang.code === current
						? 'bg-white/15 font-medium'
						: 'hover:bg-white/10'}"
				>
					<span class="text-base">{lang.flag}</span>
					<span>{lang.label}</span>
					{#if lang.code === current}
						<span class="ml-auto text-xs opacity-70">✓</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
