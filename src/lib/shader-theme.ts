import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type ShaderTheme = 'dark' | 'light';

function createShaderTheme() {
	const stored = browser ? (localStorage.getItem('shaderTheme') as ShaderTheme | null) : null;

	const initial: ShaderTheme = stored ?? 'dark';

	const { subscribe, set, update } = writable<ShaderTheme>(initial);

	return {
		subscribe,
		set: (value: ShaderTheme) => {
			if (browser) {
				localStorage.setItem('shaderTheme', value);
			}

			set(value);
		},
		update
	};
}

export const shaderTheme = createShaderTheme();

export function toggleShaderTheme() {
	shaderTheme.update((t) => {
		const next = t === 'dark' ? 'light' : 'dark';

		if (browser) {
			localStorage.setItem('shaderTheme', next);
		}

		return next;
	});
}
