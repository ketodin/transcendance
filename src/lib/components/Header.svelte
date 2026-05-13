<script lang="ts">
	import { resolve } from '$app/paths';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, setLocale } from '$lib/paraglide/runtime';

	const languages = [
		{ code: 'fr', flag: '🇫🇷', label: 'Français' },
		{ code: 'en', flag: '🇬🇧', label: 'English' },
		{ code: 'es', flag: '🇪🇸', label: 'Español' }
	] as const;

	type Locale = (typeof languages)[number]['code'];

	let current = $state(getLocale() satisfies Locale);

	function selectLanguage(code: Locale) {
		current = code;
		void setLocale(current);
	}

	const currentLang = $derived(languages.find((l) => l.code === current) ?? languages[0]);

	let showPassword = $state(false);
</script>

<header class="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
		<a href={resolve('/')} class="shrink-0 text-xl font-bold tracking-tight">Transcendence</a>

		<div class="flex items-center gap-4">
			<div class="hidden items-center gap-2 md:flex">
				<Dialog.Root>
					<Dialog.Trigger
						class="bg-card text-card-foreground hover:bg-accent cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors"
					>
						{m.login()}
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title class="text-2xl">{m.login()}</Dialog.Title>
						</Dialog.Header>
						<form onsubmit={(e) => e.preventDefault()} class="grid gap-4 py-4">
							<div class="grid gap-2">
								<Label for="login-email">Email</Label>
								<Input id="login-email" type="email" placeholder={m.mail_place_holder()} />
							</div>
							<div class="grid gap-2">
								<Label for="login-password">{m.password()}</Label>
								<Input id="login-password" type={showPassword ? 'text' : 'password'} />
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Checkbox id="show-login-password" bind:checked={showPassword} />
								<Label for="show-login-password">{m.show_password()}</Label>
							</div>
							<Button type="submit" class="mt-2 w-full">{m.login()}</Button>
						</form>
					</Dialog.Content>
				</Dialog.Root>

				<Dialog.Root>
					<Dialog.Trigger
						class="bg-primary text-primary-foreground cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:opacity-90"
					>
						{m.register()}
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title class="text-2xl">{m.register()}</Dialog.Title>
						</Dialog.Header>
						<form onsubmit={(e) => e.preventDefault()} class="grid gap-4 py-4">
							<div class="grid gap-2">
								<Label for="reg-name">{m.name()}</Label>
								<Input id="reg-name" placeholder={m.name_place_holder()} />
							</div>
							<div class="grid gap-2">
								<Label for="reg-email">Email</Label>
								<Input id="reg-email" type="email" placeholder={m.mail_place_holder()} />
							</div>
							<div class="grid gap-2">
								<Label for="reg-password">{m.password()}</Label>
								<Input id="reg-password" type={showPassword ? 'text' : 'password'} />
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Checkbox id="show-register-password" bind:checked={showPassword} />
								<Label for="show-register-password">{m.show_password()}</Label>
							</div>
							<Button type="submit" class="mt-2 w-full">{m.register()}</Button>
						</form>
					</Dialog.Content>
				</Dialog.Root>
			</div>

			<div class="bg-border hidden h-6 w-px md:block"></div>

			<Popover.Root>
				<!-- eslint-disable-next-line @typescript-eslint/no-unsafe-call -->
				<Popover.Trigger class={buttonVariants({ variant: 'outline' })}>
					{currentLang.flag}
				</Popover.Trigger>
				<Popover.Content class="w-36 p-1" align="end">
					{#each languages as lang (lang.code)}
						<button
							onclick={() => selectLanguage(lang.code)}
							class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors
								{lang.code === current ? 'bg-accent font-medium' : 'hover:bg-accent'}"
						>
							<span>{lang.flag}</span>
							<span>{lang.label}</span>
							{#if lang.code === current}
								<span class="ml-auto text-xs">✓</span>
							{/if}
						</button>
					{/each}
				</Popover.Content>
			</Popover.Root>

			<div class="bg-border hidden h-6 w-px md:block"></div>

			<Button onclick={toggleMode} variant="outline" size="icon" class="shrink-0">
				<SunIcon
					class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
				/>
				<MoonIcon
					class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
				/>
			</Button>
		</div>
	</div>
</header>
