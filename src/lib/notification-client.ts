import { toast } from 'svelte-sonner';
import GameInviteToast from '$lib/components/GameInviteToast.svelte';
import type { Room } from '@colyseus/sdk';
import { m } from '$lib/paraglide/messages';
import { list as getFriendList } from '$lib/friends.remote';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

export function attachNotificationListeners(room: Room) {
	const NOTIF_FRIEND: string = 'notification_friend_request';
	room.onMessage(`${NOTIF_FRIEND}_received`, () => {
		void getFriendList().refresh();
		toast.info(m.friend_request_received());
	});
	room.onMessage(`${NOTIF_FRIEND}_accepted`, () => {
		void getFriendList().refresh();
		toast.success(m.friend_request_accepted());
	});
	room.onMessage(`${NOTIF_FRIEND}_denied`, () => {
		void getFriendList().refresh();
		toast.warning(m.friend_request_denied());
	});

	const NOTIF_INVITE: string = 'notification_invite_request';
	room.onMessage(
		`${NOTIF_INVITE}_received`,
		({ fromUserName, roomId }: { fromUserName: string; roomId: string }) => {
			const toastId = toast.custom(GameInviteToast, {
				componentProps: {
					message: m.game_invite_received() + fromUserName,
					onAccept: async () => {
						toast.dismiss(toastId);
						await goto(resolve('/game/[[id]]', { id: roomId }), { invalidateAll: true });
					},
					onDeny: () => toast.dismiss(toastId)
				}
			});
		}
	);
	room.onMessage(`${NOTIF_INVITE}_accepted`, () => toast.success(m.game_invite_accepted()));
	room.onMessage(`${NOTIF_INVITE}_denied`, () => toast.warning(m.game_invite_denied()));
}
