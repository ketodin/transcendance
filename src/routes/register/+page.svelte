<script lang="ts">
	import type { PageProps } from './$types';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';
	import LanguagePicker from '$lib/components/LanguagePicker.svelte';
	import { m } from '$lib/paraglide/messages';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	const form = $derived(superForm(data.form, { validators: zod4Client(formSchema) }));
	const { form: formData, enhance } = $derived(form);
</script>

<div class="min-h-screen flex items-center justify-center bg-muted/30 px-4">
	<div class="w-full max-w-md space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-semibold tracking-tight">
				{m.register()}
			</h1>
			<LanguagePicker />
		</div>
		<div class="rounded-2xl border bg-background shadow-sm p-6">
			<form method="POST" use:enhance class="space-y-5">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class="text-sm font-medium">{m.name()}</Form.Label>
							<Input
								{...props}
								type="text"
								bind:value={$formData.name}
								placeholder={m.name_place_holder()}
								class="h-11"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
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
				<Form.Field {form} name="repeatPassword">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class="text-sm font-medium">
								{m.repeat_password?.() ?? "Repeat password"}
							</Form.Label>
							<Input
								{...props}
								type="password"
								bind:value={$formData.repeatPassword}
								placeholder="••••••••"
								class="h-11"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button class="w-full h-11 text-base font-medium">
					{m.register()}
				</Form.Button>
				<p class="text-muted-foreground text-center text-sm">
					{m.already_account()} <a href={resolve('/login')} class="underline">{m.login()}</a>
				</p>
			</form>
		</div>
	</div>
</div>
