import { toast } from 'svelte-sonner';
import { toast as _toast } from '$lib/components/toast';
import GameInviteToast from '$lib/components/GameInviteToast.svelte';
import type { Room } from '@colyseus/sdk';
import { m } from '$lib/paraglide/messages';
import { list as getFriendList } from '$lib/friends.remote';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import * as invite from '$lib/invite.remote';
import { applyAction } from '$app/forms';
import type { HttpError } from '@sveltejs/kit';

export function attachNotificationListeners(room: Room) {
	const NOTIF_FRIEND: string = 'notification_friend_request';
	room.onMessage(`${NOTIF_FRIEND}_received`, () => {
		void getFriendList().refresh();
		toast.info(m.friend_request_received());
	});
	room.onMessage(`${NOTIF_FRIEND}_accepted`, ({ fromUserName }: { fromUserName: string }) => {
		void getFriendList().refresh();
		toast.success(m.friend_request_accepted({ name: fromUserName }));
	});
	room.onMessage(`${NOTIF_FRIEND}_denied`, ({ fromUserName }: { fromUserName: string }) => {
		void getFriendList().refresh();
		toast.warning(m.friend_request_denied({ name: fromUserName }));
	});
	room.onMessage(`${NOTIF_FRIEND}_removed`, () => void getFriendList().refresh());

	const NOTIF_INVITE: string = 'notification_invite_request';
	room.onMessage(
		`${NOTIF_INVITE}_received`,
		({
			fromUserId,
			fromUserName,
			roomId
		}: {
			fromUserId: string;
			fromUserName: string;
			roomId: string;
		}) => {
			const toastId = toast.custom(GameInviteToast, {
				componentProps: {
					message: m.game_invite_received({ name: fromUserName }),
					onAccept: async () => {
						toast.dismiss(toastId);
						try {
							await invite.accept({ roomId, toUserId: fromUserId });
						} catch (err) {
							const error = err as HttpError;
							return await applyAction({
								type: 'error',
								status: error.status,
								error: { message: error.body.message }
							});
						}
						await goto(resolve('/game/[[id]]', { id: roomId }), { invalidateAll: true });
					},
					onDeny: async () => {
						toast.dismiss(toastId);
						await invite.deny({ toUserId: fromUserId });
					}
				}
			});
		}
	);
	room.onMessage(`${NOTIF_INVITE}_accepted`, ({ fromUserName }: { fromUserName: string }) =>
		_toast.success(m.game_invite_accepted({ name: fromUserName }))
	);
	room.onMessage(`${NOTIF_INVITE}_denied`, ({ fromUserName }: { fromUserName: string }) => {
		_toast.warning(m.game_invite_denied({ name: fromUserName }));
		void goto(resolve('/'));
	});
}
