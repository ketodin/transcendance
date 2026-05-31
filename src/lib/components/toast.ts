import { toast as _toast } from 'svelte-sonner';

const defaults = {
	unstyled: true,
	classes: {
		toast: 'class flex px-4 py-3 gap-4'
	}
};

export const toast = {
	success: (msg: string, opts?: object) =>
		_toast.success(msg, {
			...defaults,
			...opts
		}),
	error: (msg: string, opts?: object) =>
		_toast.error(msg, {
			...defaults,
			...opts
		}),
	info: (msg: string, opts?: object) =>
		_toast.info(msg, {
			...defaults,
			...opts
		}),
	warning: (msg: string, opts?: object) =>
		_toast.warning(msg, {
			...defaults,
			...opts
		}),
	default: (msg: string, opts?: object) =>
		_toast(msg, {
			...defaults,
			...opts
		})
};
