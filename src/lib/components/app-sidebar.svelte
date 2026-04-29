<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import {
    Crosshair,
    MessageSquare,
    BarChart2,
    Shield,
    Settings,
  } from "@lucide/svelte";

  const navItems = [
    { icon: Crosshair, label: "Play", href: "/game" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
    { icon: BarChart2, label: "Rankings", href: "/rankings" },
  ];
</script>

<Sidebar.Root collapsible="icon">
  <Sidebar.Header class="border-b border-sidebar-border px-4 py-3">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary">
        <Shield class="h-4 w-4 text-primary-foreground" />
      </div>
      <span class="truncate text-sm font-semibold tracking-wide group-data-[collapsible=icon]:hidden">
        Transcendence
      </span>
    </div>
  </Sidebar.Header>

  <Sidebar.Content class="py-2">
    <Sidebar.Group>
      <Sidebar.GroupLabel class="group-data-[collapsible=icon]:hidden px-4 text-xs text-muted-foreground uppercase tracking-widest mb-1">
        Transcendence
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each navItems as item}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton href={item.href} class="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors rounded-md mx-1">
                <item.icon class="h-4 w-4 shrink-0" />
                <span class="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Footer class="border-t border-sidebar-border p-3">
    <div class="flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2.5">
      <div class="relative shrink-0">
        <div class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/40">
          <span class="text-xs font-bold text-primary">P</span>
        </div>
      </div>
      <div class="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <p class="truncate text-sm font-medium leading-none">Player</p>
        <div class="mt-1">
          <span class="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-500">
            <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Online
          </span>
        </div>
      </div>
      <Settings class="h-4 w-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
    </div>
  </Sidebar.Footer>
</Sidebar.Root>
