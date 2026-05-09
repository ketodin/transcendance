<script lang="ts">
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
</script>

<header class="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
		<a href="/" class="shrink-0 text-xl font-bold tracking-tight"> Transcendence </a>

		<div class="flex items-center gap-4">
			<div class="hidden items-center gap-2 md:flex">
				<Dialog.Root>
					<Dialog.Trigger
						class="bg-card text-card-foreground hover:bg-accent cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors"
					>
						Login
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title class="text-2xl">Welcome back</Dialog.Title>
							<Dialog.Description>Enter your credentials to access your account.</Dialog.Description
							>
						</Dialog.Header>
						<form onsubmit={(e) => e.preventDefault()} class="grid gap-4 py-4">
							<div class="grid gap-2">
								<Label for="login-email">Email</Label>
								<Input id="login-email" type="email" placeholder="name@example.com" />
							</div>
							<div class="grid gap-2">
								<Label for="login-password">Password</Label>
								<Input id="login-password" type="password" />
							</div>
							<Button type="submit" class="mt-2 w-full">Sign In</Button>
						</form>
					</Dialog.Content>
				</Dialog.Root>

				<Dialog.Root>
					<Dialog.Trigger
						class="bg-primary text-primary-foreground cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:opacity-90"
					>
						Register
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title class="text-2xl">Create an account</Dialog.Title>
							<Dialog.Description
								>Enter your details below to create your account.</Dialog.Description
							>
						</Dialog.Header>
						<form onsubmit={(e) => e.preventDefault()} class="grid gap-4 py-4">
							<div class="grid gap-2">
								<Label for="reg-name">Full Name</Label>
								<Input id="reg-name" placeholder="John Doe" />
							</div>
							<div class="grid gap-2">
								<Label for="reg-email">Email</Label>
								<Input id="reg-email" type="email" placeholder="name@example.com" />
							</div>
							<div class="grid gap-2">
								<Label for="reg-password">Password</Label>
								<Input id="reg-password" type="password" />
							</div>
							<Button type="submit" class="mt-2 w-full">Create Account</Button>
						</form>
					</Dialog.Content>
				</Dialog.Root>
			</div>

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
