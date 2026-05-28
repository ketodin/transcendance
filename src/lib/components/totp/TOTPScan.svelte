<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Form from '$lib/components/ui/form';
	import type { SuperForm, Infer } from 'sveltekit-superforms';
	import type { VerifySchema } from './schema';
	import QRCode from 'qrcode';
	import { m } from '$lib/paraglide/messages';

	let { form, totpUri }: { form: SuperForm<Infer<VerifySchema>>; totpUri: string } = $props();
	const { form: formData, enhance } = $derived(form);

	let canvasEl = $state<HTMLCanvasElement | null>(null);

	$effect(() => {
		if (canvasEl && totpUri) {
			void QRCode.toCanvas(canvasEl, totpUri, { width: 200 });
		}
	});
</script>

<div class="space-y-5">
	<h2 class="text-lg font-medium">{m.scan_qr_title()}</h2>
	<canvas bind:this={canvasEl} class="mx-auto rounded-lg"></canvas>
	<p class="text-muted-foreground text-center text-sm">{m.scan_qr_description()}</p>
	<form method="POST" action="?/verify" use:enhance class="space-y-5">
		<Form.Field {form} name="code">
			<Form.Control>
				{#snippet children({ props })}
					<Input
						{...props}
						type="text"
						bind:value={$formData.code}
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
