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
<div class="flex flex-col">
  <Header />
  <Sidebar.Provider>
    <div class="flex flex-1 min-h-screen">
      <AppSidebar />
      <main class="flex-1 w-full px-4 py-8">
        <Sidebar.Trigger />
        {@render children?.()}
      </main>
    </div>
  </Sidebar.Provider>
  <Footer />
</div>
