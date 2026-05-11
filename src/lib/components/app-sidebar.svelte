<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Crosshair, MessageSquare, BarChart2, Settings, User } from '@lucide/svelte';
	import { m } from "$lib/paraglide/messages";

	const navItems = [
		{ icon: Crosshair, label: m.play(), href: resolve('/game') },
		{ icon: MessageSquare, label: m.chat(), href: resolve('/chat') },
		{ icon: BarChart2, label: m.rank(), href: resolve('/rankings') },
		{ icon: User, label: m.profile(), href: resolve('/profile') },
	];
</script>

<Sidebar.Root
	collapsible="none"
	class="bg-sidebar flex h-[calc(100vh-64px)] w-64 flex-col border-r"
>
	<Sidebar.Content class="flex-1 overflow-y-auto py-2">
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each navItems as item (item.href)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a
										href={item.href}
										{...props}
										class="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent mx-1 flex items-center gap-3 rounded-md px-4 py-2 text-sm transition-colors"
									>
										<item.icon class="h-4 w-4 shrink-0" />
										<span>{item.label}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer class="border-sidebar-border bg-sidebar mt-auto border-t p-3">
		<div class="bg-sidebar-accent flex items-center gap-3 rounded-lg px-3 py-2.5">
			<div class="relative shrink-0">
				<div
					class="bg-primary/20 ring-primary/40 flex h-8 w-8 items-center justify-center rounded-full ring-2"
				>
					<span class="text-primary text-xs font-bold">P</span>
				</div>
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm leading-none font-medium">Player</p> <!-- TODO: add real player name -->
				<div class="mt-1">
					<span
						class="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-500"
					>
						<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
						{m.online()}
					</span>
				</div>
			</div>
			<Settings class="text-muted-foreground h-4 w-4 shrink-0" />
		</div>
	</Sidebar.Footer>
</Sidebar.Root>
