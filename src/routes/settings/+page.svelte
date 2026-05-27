<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Form from '$lib/components/ui/form';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { enableSchema, verifySchema, disableSchema } from './schema';
	import QRCode from 'qrcode';
	import type { PageProps } from './$types';
	import { untrack } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import * as z from 'zod';
	import { en, fr, es } from 'zod/locales';

	const localeMap = { en, fr, es };
	z.config(localeMap[getLocale()]());

	let { data }: PageProps = $props();

	const enableForm = $derived(
		superForm(
			untrack(() => data.enableForm),
			{
				id: 'enable',
				validators: zod4Client(enableSchema)
			}
		)
	);
	const { form: enableData, enhance: enableEnhance, message: enableMsg } = $derived(enableForm);

	const verifyForm = $derived(
		superForm(
			untrack(() => data.verifyForm),
			{
				id: 'verify',
				validators: zod4Client(verifySchema)
			}
		)
	);
	const { form: verifyData, enhance: verifyEnhance, message: verifyMsg } = $derived(verifyForm);

	const disableForm = $derived(
		superForm(
			untrack(() => data.disableForm),
			{
				id: 'disable',
				validators: zod4Client(disableSchema)
			}
		)
	);
	const { form: disableData, enhance: disableEnhance } = $derived(disableForm);

	type EnableMsg = { totpUri: string; backupCodes: string[] } | null;

	const totpUri = $derived(($enableMsg as EnableMsg)?.totpUri ?? '');
	const backupCodes = $derived(($enableMsg as EnableMsg)?.backupCodes ?? []);
	let step = $derived($verifyMsg === 'done' ? 'done' : totpUri ? 'scan' : 'idle');

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let copiedIndex = $state<number | null>(null);

	$effect(() => {
		if (step === 'scan' && canvasEl && totpUri) {
			void QRCode.toCanvas(canvasEl, totpUri, { width: 200 });
		}
	});

	function copyAll() {
		void navigator.clipboard.writeText(backupCodes.join('\n'));
		copiedIndex = -1;
		setTimeout(() => (copiedIndex = null), 1500);
	}
</script>

<div class="glass mx-auto max-w-md space-y-6 p-6">
	<h1 class="text-2xl font-semibold tracking-tight">{m.settings()}</h1>

	{#if step === 'done'}
		<div class="space-y-5">
			<h2 class="text-lg font-medium text-green-600">{m.two_fa_enabled_title()} ✓</h2>
			<p class="text-muted-foreground text-sm">{m.backup_codes_description()}</p>
			<div class="bg-muted rounded-lg p-4">
				<div class="flex flex-col gap-2">
					{#each backupCodes as c, i (i)}
						<div class="flex items-center font-mono text-sm">
							<span class="text-muted-foreground w-5">{i + 1}.</span>
							<span class="flex-1 tracking-wider">{c}</span>
						</div>
					{/each}
				</div>
			</div>
			<Form.Button
				type="button"
				onclick={copyAll}
				variant="outline"
				class="h-11 w-full text-base font-medium"
			>
				{copiedIndex === -1 ? `${m.copied()} ✓` : m.copy_all()}
			</Form.Button>
			<button
				onclick={() => {
					step = 'idle';
				}}
				class="text-muted-foreground block text-center text-sm underline"
			>
				{m.back_to_settings()}
			</button>
		</div>
	{:else if data.user.twoFactorEnabled}
		<form method="POST" action="?/disable" use:disableEnhance class="space-y-5">
			<h2 class="text-lg font-medium">{m.disable_2fa_title()}</h2>
			<Form.Field form={disableForm} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="text-sm font-medium">{m.password()}</Form.Label>
						<Input
							{...props}
							type="password"
							bind:value={$disableData.password}
							placeholder={m.current_password_placeholder()}
							class="h-11"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Button variant="destructive" class="h-11 w-full text-base font-medium">
				{m.disable()}
			</Form.Button>
		</form>
	{:else if step === 'idle'}
		<form method="POST" action="?/enable" use:enableEnhance class="space-y-5">
			<div>
				<h2 class="text-lg font-medium">{m.two_fa_enable_title()}</h2>
				<p class="text-muted-foreground text-sm">{m.two_fa_enable_description()}</p>
			</div>
			<Form.Field form={enableForm} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="text-sm font-medium">{m.password()}</Form.Label>
						<Input
							{...props}
							type="password"
							bind:value={$enableData.password}
							placeholder={m.current_password_placeholder()}
							class="h-11"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Button class="glass h-11 w-full text-base font-medium">
				{m.generate_qr()}
			</Form.Button>
		</form>
	{:else if step === 'scan'}
		<div class="space-y-5">
			<h2 class="text-lg font-medium">{m.scan_qr_title()}</h2>
			<canvas bind:this={canvasEl} class="mx-auto rounded-lg"></canvas>
			<p class="text-muted-foreground text-center text-sm">{m.scan_qr_description()}</p>
			<form method="POST" action="?/verify" use:verifyEnhance class="space-y-5">
				<Form.Field form={verifyForm} name="code">
					<Form.Control>
						{#snippet children({ props })}
							<Input
								{...props}
								type="text"
								bind:value={$verifyData.code}
								maxlength={6}
								placeholder="000000"
								class="h-11 text-center text-2xl tracking-widest"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button class="glass h-11 w-full text-base font-medium">
					{m.verify_activate()}
				</Form.Button>
			</form>
		</div>
	{/if}
</div>
