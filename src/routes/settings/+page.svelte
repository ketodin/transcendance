<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LanguagePicker from '$lib/components/LanguagePicker.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { authClient } from '$lib/auth-client';
	import QRCode from 'qrcode';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { m } from '$lib/paraglide/messages';

	let { data }: PageProps = $props();

	type AuthError = { message: string; code?: string } | null;
	let step = $state<'idle' | 'scan' | 'done'>('idle');
	let password = $state('');
	let otpCode = $state('');
	let totpUri = $state('');
	let backupCodes = $state<string[]>([]);
	let error = $state<AuthError>(null);
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let copiedIndex = $state<number | null>(null);
	let disablePassword = $state('');
	let disableError = $state<AuthError>(null);

	$effect(() => {
		if (step === 'scan' && canvasEl && totpUri) {
			void QRCode.toCanvas(canvasEl, totpUri, { width: 200 });
		}
	});

	async function startSetup() {
		error = null;
		const result = await authClient.twoFactor.enable({ password });
		if (result.error) {
			error = {
				message:
					result.error.code === 'INVALID_PASSWORD'
						? m.error_invalid_password()
						: m.error_generic(),
				code: result.error.code
			};
			return;
		}
		totpUri = result.data?.totpURI ?? '';
		backupCodes = result.data?.backupCodes ?? [];
		step = 'scan';
	}

	async function confirmSetup() {
		error = null;
		const result = await authClient.twoFactor.verifyTotp({ code: otpCode });
		if (result.error) {
			error = {
				message:
					result.error.code === 'INVALID_TWO_FACTOR_COOKIE'
						? m.error_session_expired()
						: m.error_invalid_code(),
				code: result.error.code
			};
			return;
		}
		step = 'done';
	}

	function copyAll() {
		void navigator.clipboard.writeText(backupCodes.join('\n'));
		copiedIndex = -1;
		setTimeout(() => (copiedIndex = null), 1500);
	}

	async function disableTwoFactor() {
		disableError = null;
		const result = await authClient.twoFactor.disable({ password: disablePassword });
		if (result.error) {
			disableError = {
				message:
					result.error.code === 'INVALID_PASSWORD'
						? m.error_invalid_password()
						: m.error_generic(),
				code: result.error.code
			};
			return;
		}
		location.reload();
	}
</script>

<div class="bg-muted/30 flex min-h-screen items-center justify-center px-4">
	<div class="glass w-full max-w-md space-y-6 p-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-semibold tracking-tight">
				{m.settings()}
			</h1>
			<div class="flex gap-3">
				<ThemeToggle />
				<div class="glass">
					<LanguagePicker />
				</div>
			</div>
		</div>

		{#if data.user.twoFactorEnabled}
			<div class="space-y-4">
				<h2 class="text-lg font-medium">{m.disable_2fa_title()}</h2>
				<div class="space-y-2">
					<Input
						type="password"
						bind:value={disablePassword}
						placeholder={m.current_password_placeholder()}
						class="h-11"
					/>
					{#if disableError}
						<p class="text-destructive text-sm">{disableError.message}</p>
					{/if}
				</div>
				<Button
					onclick={() => void disableTwoFactor()}
					variant="destructive"
					class="h-11 w-full text-base font-medium"
				>
					{m.disable()}
				</Button>
			</div>

		{:else if step === 'idle'}
			<div class="space-y-4">
				<div>
					<h2 class="text-lg font-medium">{m.two_fa_enable_title()}</h2>
					<p class="text-muted-foreground text-sm">{m.two_fa_enable_description()}</p>
				</div>
				<div class="space-y-2">
					<Input
						type="password"
						bind:value={password}
						placeholder={m.current_password_placeholder()}
						class="h-11"
					/>
					{#if error}
						<p class="text-destructive text-sm">{error.message}</p>
					{/if}
				</div>
				<Button
					onclick={() => void startSetup()}
					class="glass h-11 w-full text-base font-medium"
				>
					{m.generate_qr()}
				</Button>
			</div>

		{:else if step === 'scan'}
			<div class="space-y-4">
				<h2 class="text-lg font-medium">{m.scan_qr_title()}</h2>
				<canvas bind:this={canvasEl} class="mx-auto rounded-lg"></canvas>
				<p class="text-muted-foreground text-center text-sm">{m.scan_qr_description()}</p>
				<div class="space-y-2">
					<Input
						type="text"
						bind:value={otpCode}
						maxlength={6}
						placeholder="000000"
						class="h-11 text-center text-2xl tracking-widest"
					/>
					{#if error}
						<p class="text-destructive text-sm">{error.message}</p>
					{/if}
				</div>
				<Button
					onclick={() => void confirmSetup()}
					class="glass h-11 w-full text-base font-medium"
				>
					{m.verify_activate()}
				</Button>
			</div>

		{:else if step === 'done'}
			<div class="space-y-4">
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
				<Button
					type="button"
					onclick={copyAll}
					variant="outline"
					class="h-11 w-full text-base font-medium"
				>
					{copiedIndex === -1 ? `${m.copied()} ✓` : m.copy_all()}
				</Button>
				<a
					href={resolve('/')}
					class="text-muted-foreground block text-center text-sm underline"
				>
					{m.continue_to_app()}
				</a>
			</div>
		{/if}
	</div>
</div>
