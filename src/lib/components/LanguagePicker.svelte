<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime';
	import { setLocale, type Locale } from '$lib/locale.svelte';

	const languages: { code: Locale; flag: string }[] = [
		{ code: 'fr', flag: '🇫🇷' },
		{ code: 'en', flag: '🇬🇧' },
		{ code: 'es', flag: '🇪🇸' }
	];

	let current = $state(getLocale());
	let open = $state(false);

	function selectLanguage(code: Locale) {
		current = code;
		setLocale(code);
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
	<button onclick={() => (open = !open)} class="items-center justify-center active:scale-95 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition">
		{currentLang.flag}
	</button>

	{#if open}
		<div class="dropdown glass">
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
		gap: 0.35rem;
		padding: 0.35rem;
		animation: pop 0.15s ease-out;
	}

	.item {
		width: 2.25rem;
		height: 2.25rem;

		border-radius: 0.5rem;
		font-size: 1.3rem;

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
