<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { Input } from '$lib/components/ui/input';
	import LanguagePicker from '$lib/components/LanguagePicker.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { authClient, signIn } from '$lib/auth-client';
	import { formSchema } from './schema';
	import * as z from 'zod';
	import { en, fr, es } from 'zod/locales';
	import google from '$lib/assets/google.png';
	import { page } from '$app/state';

	const localeMap = { en, fr, es };
	z.config(localeMap[getLocale()]());

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let step = $state<'credentials' | 'totp'>('credentials');
	let code = $state('');
	let useBackup = $state(false);
	let fieldErrors = $state<{ email?: string; password?: string }>({});

	const redirectTo = page.url.searchParams.get('redirectTo');
	const redirectUrl = redirectTo ? '/' + decodeURIComponent(redirectTo) : '/';

	async function handleSubmit() {
		error = '';
		fieldErrors = {};

		const result = formSchema.safeParse({ email, password });
		if (!result.success) {
			const flat = result.error.flatten().fieldErrors;
			fieldErrors = {
				email: flat.email?.[0],
				password: flat.password?.[0]
			};
			return;
		}

		await signIn.email({
			email,
			password,
			callbackURL: redirectUrl,
			fetchOptions: {
				onSuccess: (ctx) => {
					if ((ctx.data as Record<string, unknown>)?.twoFactorRedirect) {
						step = 'totp';
					}
				},
				onError: (ctx) => {
					error = ctx.error.message;
				}
			}
		});
	}

	async function verifyTotp() {
		error = '';
		const result = await authClient.twoFactor.verifyTotp({ code });
		if (result.error != null) {
			error = result.error?.message ?? 'Unknown error';
			return;
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(redirectUrl, { replaceState: true, invalidateAll: true });
	}

	async function verifyBackupCode() {
		error = '';
		const result = await authClient.twoFactor.verifyBackupCode({ code });
		if (result.error != null) {
			error = result.error?.message ?? 'Unknown error';
			return;
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(redirectUrl, { replaceState: true, invalidateAll: true });
	}

	function goBack() {
		step = 'credentials';
		code = '';
		error = '';
		useBackup = false;
	}
	async function signInWithGoogle() {
		error = '';
		await authClient.signIn.social({
			provider: 'google',
			callbackURL: `/setup-username?redirectTo=${encodeURIComponent(redirectUrl)}`,
			fetchOptions: {
				onError: (ctx) => {
					error = ctx.error.message;
				}
			}
		});
	}
</script>

<div class="bg-muted/30 flex min-h-screen items-center justify-center">
	<div class="glass w-full max-w-md space-y-6 p-6">
		<div class="flex justify-between">
			<h1 class="text-3xl font-semibold">
				{m.login()}
			</h1>
			<div class="flex gap-4">
				<LanguagePicker />
				<ThemeToggle />
			</div>
		</div>

		<div>
			{#if step === 'credentials'}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						void handleSubmit();
					}}
					class="space-y-5"
				>
					<div>
						<label class="text-sm font-medium" for="email">{m.email()}</label>
						<Input
							id="email"
							type="text"
							bind:value={email}
							autocomplete="email"
							placeholder={m.mail_place_holder()}
							class="h-11"
						/>
						{#if fieldErrors.email}
							<p class="text-destructive text-sm font-medium">{fieldErrors.email}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium" for="password">{m.password()}</label>
						<Input
							id="password"
							type="password"
							autocomplete="current-password"
							bind:value={password}
							placeholder="••••••••"
							class="h-11"
						/>
						{#if fieldErrors.password}
							<p class="text-destructive text-sm font-medium">{fieldErrors.password}</p>
						{/if}
					</div>

					{#if error}
						<p class="text-destructive text-sm font-medium">{error}</p>
					{/if}

					<button type="submit" class="glassbutton h-11 w-full text-base font-medium">
						{m.login()}
					</button>
					<button
						type="button"
						class="glassbutton flex h-11 w-full items-center justify-center gap-2 text-base font-medium"
						onclick={() => void signInWithGoogle()}
					>
						<img src={google} alt="Google" class="h-5 w-5" />
						{m.google()}
					</button>
					<p class="text-muted-foreground text-center text-sm">
						{m.no_account()}
						<a
							href={resolve(redirectTo ? `/register?redirectTo=${redirectTo}` : '/register')}
							class="underline">{m.register()}</a
						>
					</p>
				</form>
			{:else}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						void (useBackup ? verifyBackupCode() : verifyTotp());
					}}
					class="space-y-5"
				>
					<p class="text-muted-foreground text-center text-sm">
						{useBackup ? m.totp_backup_instruction() : m.totp_app_instruction()}
					</p>

					<div class="space-y-2">
						<label class="text-sm font-medium" for="code">
							{useBackup ? m.backup_code() : m.totp_code()}
						</label>
						<Input
							id="code"
							type="text"
							bind:value={code}
							maxlength={useBackup ? 11 : 6}
							placeholder={useBackup ? 'xxxxxxxxxx' : '000000'}
							class="h-11 text-center text-2xl tracking-widest"
						/>
					</div>

					{#if error}
						<p class="text-destructive text-sm font-medium">{error}</p>
					{/if}

					<button type="submit" class="glass h-11 w-full text-base font-medium">{m.verify()}</button
					>

					<div class="text-muted-foreground flex justify-between text-sm">
						<button
							type="button"
							onclick={() => {
								useBackup = !useBackup;
								code = '';
								error = '';
							}}
						>
							{useBackup ? m.back_to_totp() : m.use_backup_code()}
						</button>
						<button type="button" onclick={goBack}>{m.back()}</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
