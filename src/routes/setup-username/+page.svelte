<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { Input } from '$lib/components/ui/input';
	import LanguagePicker from '$lib/components/LanguagePicker.svelte';
	import { m } from '$lib/paraglide/messages';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let name = $state('');

	const errorMap: Record<string, () => string> = {
		username_taken: m.error_username_taken,
		username_length: m.error_username_length,
		username_format: m.error_username_format
	};
</script>

<div class="bg-muted/30 flex min-h-screen items-center justify-center">
	<div class="glass w-full max-w-md space-y-6 p-6">
		<div class="flex justify-between">
			<h1 class="text-3xl font-semibold">{m.setup_username_title()}</h1>
			<div class="flex gap-4">
				<LanguagePicker />
				<ThemeToggle />
			</div>
		</div>

		<p class="text-muted-foreground text-sm">{m.setup_username_desc()}</p>

		<form method="POST" use:enhance class="space-y-5">
			<input type="hidden" name="redirectTo" value={data.redirectTo} />

			<div>
				<label class="text-sm font-medium" for="name">{m.name()}</label>
				<Input
					id="name"
					name="name"
					type="text"
					bind:value={name}
					placeholder={m.name_place_holder()}
					class="h-11"
					autocomplete="off"
				/>
				{#if form?.error}
					<p class="text-destructive text-sm font-medium">
						{errorMap[form.error]?.() ?? form.error}
					</p>
				{/if}
			</div>

			<button type="submit" class="glassbutton h-11 w-full text-base font-medium">
				{m.confirm()}
			</button>
		</form>
	</div>
</div>
