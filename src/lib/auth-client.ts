import { createAuthClient } from 'better-auth/svelte';
import { twoFactorClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
    plugins: [twoFactorClient()],
});
export const { signIn, signUp, signOut, useSession } = authClient;
