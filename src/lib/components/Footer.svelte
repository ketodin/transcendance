<script lang="ts">
    import { t } from "svelte-i18n";
</script>

<footer class="border-t bg-background">
  <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-end text-sm text-muted-foreground">
    <div class="flex gap-4">
      <a href="/legal/privacy" class="hover:text-foreground transition-colors">
        {$t("footer.privacy")}
      </a>
      <a href="/legal/terms" class="hover:text-foreground transition-colors">
        {$t("footer.terms")}
      </a>
    </div>
  </div>
</footer>
