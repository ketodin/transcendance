import { browser } from '$app/environment';
import {
	getLocale as _getLocale,
	setLocale as _setLocale,
	overwriteGetLocale,
	locales
} from '$lib/paraglide/runtime';

export type Locale = (typeof locales)[number];

let _locale = $state<Locale>(_getLocale());

export function getReactiveLocale(): Locale {
	return _locale;
}

if (browser) {
	overwriteGetLocale(() => _locale);
}

import { z } from 'zod';
import { en, fr, es } from 'zod/locales';

const localeMap = {
	en,
	fr,
	es
};

export function setLocale(newLocale: Locale) {
	void _setLocale(newLocale, { reload: false });
	_locale = newLocale;
	z.config(localeMap[newLocale]());
}
