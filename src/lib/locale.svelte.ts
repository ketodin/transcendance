import { browser } from '$app/environment';
import {
	getLocale as _getLocale,
	setLocale as _setLocale,
	overwriteGetLocale,
	locales
} from '$lib/paraglide/runtime';

export type Locale = (typeof locales)[number];

let _locale = $state<Locale>(_getLocale());

if (browser) {
	overwriteGetLocale(() => _locale);
}

export function setLocale(locale: Locale) {
	void _setLocale(locale, { reload: false });
	_locale = locale;
}
