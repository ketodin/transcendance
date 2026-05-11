<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import "../app.css";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  let { children } = $props();
</script>

<ModeWatcher />

<div class="relative flex min-h-screen flex-col">
  <Header />
  
  <div class="flex-1">
    <Sidebar.Provider>
      <div class="flex min-h-[calc(100vh-64px)] w-full">
        <AppSidebar />
        <main class="flex-1 w-full px-4 py-8">
          {@render children?.()}
        </main>
      </div>
    </Sidebar.Provider>
  </div>

  <Footer />
</div>

