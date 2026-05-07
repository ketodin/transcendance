<script lang="ts">
  import SunIcon from "@lucide/svelte/icons/sun";
  import MoonIcon from "@lucide/svelte/icons/moon";
  import { toggleMode } from "mode-watcher";

  import { Button } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";

  import { t } from "svelte-i18n";
  import { locale } from "svelte-i18n";

  function setLang(lang: "en" | "fr") {
	  locale.set(lang);
  }
</script>

<header class="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
    
    <a href="/" class="font-bold text-xl tracking-tight shrink-0">
      Transcendence
    </a>

    <div class="flex items-center gap-4">
      
      <div class="hidden md:flex items-center gap-2">

        <!-- LOGIN -->
        <Dialog.Root>
          <Dialog.Trigger class="px-4 py-2 text-sm font-medium border rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent transition-colors cursor-pointer">
            {$t("header.login")}
          </Dialog.Trigger>

          <Dialog.Content class="sm:max-w-[425px]">
            <Dialog.Header>
              <Dialog.Title class="text-2xl">
                {$t("header.welcomeBack")}
              </Dialog.Title>
              <Dialog.Description>
                {$t("header.loginDesc")}
              </Dialog.Description>
            </Dialog.Header>

            <form onsubmit={(e) => e.preventDefault()} class="grid gap-4 py-4">
              <div class="grid gap-2">
                <Label for="login-email">{$t("header.email")}</Label>
                <Input id="login-email" type="email" placeholder="name@example.com" />
              </div>

              <div class="grid gap-2">
                <Label for="login-password">{$t("header.password")}</Label>
                <Input id="login-password" type="password" />
              </div>

              <Button type="submit" class="w-full mt-2">
                {$t("header.signIn")}
              </Button>
            </form>
          </Dialog.Content>
        </Dialog.Root>

        <!-- REGISTER -->
        <Dialog.Root>
          <Dialog.Trigger class="px-4 py-2 text-sm font-medium border rounded-lg bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-colors cursor-pointer">
            {$t("header.register")}
          </Dialog.Trigger>

          <Dialog.Content class="sm:max-w-[425px]">
            <Dialog.Header>
              <Dialog.Title class="text-2xl">
                {$t("header.createAccount")}
              </Dialog.Title>
              <Dialog.Description>
                {$t("header.registerDesc")}
              </Dialog.Description>
            </Dialog.Header>

            <form onsubmit={(e) => e.preventDefault()} class="grid gap-4 py-4">
              <div class="grid gap-2">
                <Label for="reg-name">{$t("header.fullName")}</Label>
                <Input id="reg-name" placeholder="John Doe" />
              </div>

              <div class="grid gap-2">
                <Label for="reg-email">{$t("header.email")}</Label>
                <Input id="reg-email" type="email" placeholder="name@example.com" />
              </div>

              <div class="grid gap-2">
                <Label for="reg-password">{$t("header.password")}</Label>
                <Input id="reg-password" type="password" />
              </div>

              <Button type="submit" class="w-full mt-2">
                {$t("header.createAccountBtn")}
              </Button>
            </form>
          </Dialog.Content>
        </Dialog.Root>

      </div>

      <div class="h-6 w-px bg-border hidden md:block"></div>
		<select
			class="h-9 px-2 text-sm border rounded-md bg-background text-foreground"
			onchange={(e) =>
				setLang((e.currentTarget as HTMLSelectElement).value as "en" | "fr")
			}
		>
			<option value="en">🇬🇧 EN</option>
			<option value="fr">🇫🇷 FR</option>
			</select>
			<div class="h-6 w-px bg-border hidden md:block"></div>
		<Button onclick={toggleMode} variant="outline" size="icon" class="shrink-0">
			<SunIcon class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
			<MoonIcon class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </Button>

    </div>
  </div>
</header>
