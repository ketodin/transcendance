<script lang="ts">
	import { getLocale, setLocale } from '$lib/paraglide/runtime';

	const languages = [
		{ code: 'fr', flag: '🇫🇷' },
		{ code: 'en', flag: '🇬🇧' },
		{ code: 'es', flag: '🇪🇸' }
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
		if (!target.closest('.lang-picker')) open = false;
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="lang-picker relative flex items-center">
	<button
		onclick={() => (open = !open)}
		class="glassbutton flex h-9 w-9 items-center justify-center text-lg transition hover:bg-white/10 active:scale-95"
	>
		{currentLang.flag}
	</button>

	{#if open}
		<div class="dropdown glassdeep">
			{#each languages as lang (lang.code)}
				<button
					onclick={() => selectLanguage(lang.code)}
					class="item {lang.code === current ? 'active' : ''}"
				>
					{lang.flag}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.dropdown {
		position: absolute;
		top: calc(100% + 1rem);
		right: 50%;
		transform: translateX(50%);

		display: flex;
		flex-direction: row;
		gap: 0.35rem;

		padding: 0.35rem;

		z-index: 50;

		animation: pop 0.15s ease-out;
	}

	.item {
		display: flex;
		align-items: center;
		justify-content: center;

		width: 2.25rem;
		height: 2.25rem;

		border-radius: 0.5rem;
		font-size: 1.1rem;

		transition: 0.15s ease;
	}

	.item:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.item.active {
		background: rgba(255, 255, 255, 0.15);
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateX(50%) translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateX(50%) translateY(0) scale(1);
		}
	}
</style>
