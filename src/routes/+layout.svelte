<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import "../app.css";
</script>

<ModeWatcher />

<div class="flex flex-col">
  <Header />
  <main class="max-w-7xl w-full mx-auto px-4 py-8 min-h-screen">
    <slot />
  </main>
  <Footer />
</div>
