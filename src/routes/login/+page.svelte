<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { PageProps } from './$types';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';
	import LanguagePicker from '$lib/components/LanguagePicker.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import * as z from 'zod';
	import { en, fr, es } from 'zod/locales';

	const localeMap = {
		en,
		fr,
		es
	};

	z.config(localeMap[getLocale()]());

	let { data }: PageProps = $props();

	const form = $derived(superForm(data.form, { validators: zod4Client(formSchema) }));
	const { form: formData, enhance } = $derived(form);
</script>

<div class="bg-muted/30 flex min-h-screen items-center justify-center px-4">
	<div class="glass w-full max-w-md space-y-6 p-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-semibold tracking-tight">
				{m.login()}
			</h1>
			<div class="flex gap-3">
				<ThemeToggle />
				<div class="glass">
					<LanguagePicker />
				</div>
			</div>
		</div>
		<div>
			<form method="POST" use:enhance class="space-y-5">
				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class="text-sm font-medium">{m.email()}</Form.Label>
							<Input
								{...props}
								type="text"
								bind:value={$formData.email}
								placeholder={m.mail_place_holder()}
								class="h-11"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class="text-sm font-medium">{m.password()}</Form.Label>
							<Input
								{...props}
								type="password"
								bind:value={$formData.password}
								placeholder="••••••••"
								class="h-11"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button class="glassbutton h-11 w-full text-base font-medium">{m.login()}</Form.Button>
				<p class="text-muted-foreground text-center text-sm">
					{m.no_account()} <a href={resolve('/register')} class="underline">{m.register()}</a>
				</p>
				<div class="text-muted-foreground flex items-center justify-between text-sm"></div>
			</form>
		</div>
	</div>
</div>
