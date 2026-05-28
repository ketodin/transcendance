<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { untrack } from 'svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import * as z from 'zod';
	import { en, fr, es } from 'zod/locales';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import { enableSchema, verifySchema, disableSchema } from './schema';
	import type { EnableSchema, VerifySchema, DisableSchema } from './schema';
	import TOTPEnable from './TOTPEnable.svelte';
	import TOTPScan from './TOTPScan.svelte';
	import TOTPDone from './TOTPDone.svelte';
	import TOTPDisable from './TOTPDisable.svelte';

	const localeMap = { en, fr, es };
	z.config(localeMap[getLocale()]());

	interface Props {
		user: { twoFactorEnabled?: boolean | null };
		enableForm: SuperValidated<Infer<EnableSchema>>;
		verifyForm: SuperValidated<Infer<VerifySchema>>;
		disableForm: SuperValidated<Infer<DisableSchema>>;
	}

	let { user, enableForm: enableFormData, verifyForm: verifyFormData, disableForm: disableFormData }: Props = $props();

	const enableSF = superForm(untrack(() => enableFormData), {
		id: 'enable',
		validators: zod4Client(enableSchema)
	});
	const { message: enableMsg } = enableSF;

	const verifySF = superForm(untrack(() => verifyFormData), {
		id: 'verify',
		validators: zod4Client(verifySchema)
	});
	const { message: verifyMsg } = verifySF;

	const disableSF = superForm(untrack(() => disableFormData), {
		id: 'disable',
		validators: zod4Client(disableSchema)
	});

	type EnableMsg = { totpUri: string; backupCodes: string[] } | null;
	const totpUri = $derived(($enableMsg as EnableMsg)?.totpUri ?? '');
	const backupCodes = $derived(($enableMsg as EnableMsg)?.backupCodes ?? []);

	let manualStep = $state<'idle' | null>(null);
	const step = $derived(
		manualStep ?? ($verifyMsg === 'done' ? 'done' : totpUri ? 'scan' : 'idle')
	) as 'idle' | 'scan' | 'done';
</script>

{#if step === 'done'}
	<TOTPDone {backupCodes} onBack={() => (manualStep = 'idle')} />
{:else if user.twoFactorEnabled}
	<TOTPDisable form={disableSF} />
{:else if step === 'idle'}
	<TOTPEnable form={enableSF} />
{:else if step === 'scan'}
	<TOTPScan form={verifySF} {totpUri} />
{/if}
