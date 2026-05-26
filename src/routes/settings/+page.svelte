<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import QRCode from 'qrcode';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

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
        message: result.error.code === 'INVALID_PASSWORD'
          ? 'Incorrect password.'
          : 'An error occurred. Please try again.',
        code: result.error.code,
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
        message: result.error.code === 'INVALID_TWO_FACTOR_COOKIE'
          ? 'Session expired, please start over.'
          : 'Incorrect code. Please try again.',
        code: result.error.code,
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
        message: result.error.code === 'INVALID_PASSWORD'
          ? 'Incorrect password.'
          : 'An error occurred. Please try again.',
        code: result.error.code,
      };
      return;
    }
    location.reload();
  }
</script>

{#if data.user.twoFactorEnabled}
  <div>
    <h2>Disable 2FA</h2>
    <input type="password" bind:value={disablePassword} placeholder="Current password" />
    {#if disableError}<p class="text-destructive text-sm">{disableError.message}</p>{/if}
    <button onclick={() => void disableTwoFactor()}>Disable</button>
  </div>

{:else if step === 'idle'}
  <div class="flex flex-col gap-4 max-w-sm mx-auto mt-20">
    <h1 class="text-2xl font-medium">Enable 2FA</h1>
    <p class="text-sm text-muted-foreground">
      Scan the QR code with Google Authenticator or Authy.
    </p>
    <input
      type="password"
      bind:value={password}
      placeholder="Current password"
      class="border rounded px-3 py-2"
    />
    {#if error}<p class="text-sm text-red-500">{error.message}</p>{/if}
    <button
      onclick={() => void startSetup()}
      class="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
    >
      Generate QR code
    </button>
  </div>

{:else if step === 'scan'}
  <div class="flex flex-col gap-4 max-w-sm mx-auto mt-20">
    <h1 class="text-2xl font-medium">Scan this QR code</h1>
    <canvas bind:this={canvasEl} class="mx-auto rounded-lg"></canvas>
    <p class="text-sm text-muted-foreground text-center">
      Then enter the 6-digit code shown in your authenticator app.
    </p>
    <input
      type="text"
      bind:value={otpCode}
      maxlength="6"
      placeholder="000000"
      class="text-center text-2xl tracking-widest border rounded-lg px-4 py-3"
    />
    {#if error}<p class="text-sm text-red-500">{error.message}</p>{/if}
    <button
      onclick={() => void confirmSetup()}
      class="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
    >
      Verify and activate
    </button>
  </div>

{:else if step === 'done'}
  <div class="flex flex-col gap-4 max-w-sm mx-auto mt-20">
    <h1 class="text-2xl font-medium text-green-600">2FA enabled ✓</h1>
    <p class="text-sm text-muted-foreground">
      Save these backup codes — they will <strong>not be shown again</strong> after you leave this page.
    </p>
    <div class="bg-muted rounded-lg p-4 flex flex-col gap-2">
      {#each backupCodes as c, i (i)}
        <div class="flex items-center font-mono text-sm">
          <span class="text-muted-foreground w-5">{i + 1}.</span>
          <span class="flex-1 tracking-wider">{c}</span>
        </div>
      {/each}
    </div>
    <button
      type="button"
      onclick={copyAll}
      class="w-full rounded-md border py-2 text-sm font-medium hover:bg-muted transition-colors"
    >
      {copiedIndex === -1 ? 'Copied ✓' : 'Copy all'}
    </button>
    <a href={resolve('/')} class="text-sm text-center text-muted-foreground underline">
      Continue to app
    </a>
  </div>
{/if}