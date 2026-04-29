<script lang="ts">
  import SunIcon from "@lucide/svelte/icons/sun";
  import MoonIcon from "@lucide/svelte/icons/moon";
  import { toggleMode } from "mode-watcher";
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<header class="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    <a href="/" class="font-semibold text-lg tracking-tight">
      Transcendence
    </a>

    <div class="flex items-center gap-2">
      <Button onclick={toggleMode} variant="outline" size="icon">
        <SunIcon
          class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90"
        />
        <MoonIcon
          class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
        />
      </Button>
    </div>
  </div>
</header>

