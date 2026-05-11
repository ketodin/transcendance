<script lang="ts">
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import {
        Crosshair,
        MessageSquare,
        BarChart2,
        Settings,
    } from "@lucide/svelte";

    const navItems = [
        { icon: Crosshair, label: "Play", href: "/game" },
        { icon: MessageSquare, label: "Chat", href: "/chat" },
        { icon: BarChart2, label: "Rankings", href: "/rankings" },
    ];
</script>

<Sidebar.Root 
    collapsible="none" 
    class="w-64 border-r bg-sidebar flex flex-col h-[calc(100vh-64px)]"
>
    <Sidebar.Content class="flex-1 overflow-y-auto py-2">
        <Sidebar.Group>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    {#each navItems as item}
                        <Sidebar.MenuItem>
                            <Sidebar.MenuButton asChild>
                                <a 
                                    href={item.href} 
                                    class="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors rounded-md mx-1"
                                >
                                    <item.icon class="h-4 w-4 shrink-0" />
                                    <span>{item.label}</span>
                                </a>
                            </Sidebar.MenuButton>
                        </Sidebar.MenuItem>
                    {/each}
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>
    </Sidebar.Content>

    <Sidebar.Footer class="mt-auto border-t border-sidebar-border p-3 bg-sidebar">
        <div class="flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2.5">
            <div class="relative shrink-0">
                <div class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/40">
                    <span class="text-xs font-bold text-primary">P</span>
                </div>
            </div>
            <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium leading-none">Player</p>
                <div class="mt-1">
                    <span class="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-500">
                        <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                        Online
                    </span>
                </div>
            </div>
            <Settings class="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
    </Sidebar.Footer>
</Sidebar.Root>
