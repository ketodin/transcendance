import { toast } from '$lib/components/toast';
import type { Room } from '@colyseus/sdk';
import { m } from '$lib/paraglide/messages';
import { list as getFriendList } from '$lib/friends.remote';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import * as invite from '$lib/invite.remote';

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
			toast.info(m.game_invite_received({ name: fromUserName }), {
				action: {
					label: ' ✔ ',
					onClick: async () => {
						await invite.accept({ roomId, toUserId: fromUserId });
						await goto(resolve('/game/[[id]]', { id: roomId }), { invalidateAll: true });
					}
				},
				cancel: {
					label: ' ✖ ',
					onClick: async () => {
						await invite.deny({ toUserId: fromUserId });
					}
				},
				duration: Infinity
			});
		}
	);
	room.onMessage(`${NOTIF_INVITE}_accepted`, ({ fromUserName }: { fromUserName: string }) =>
		toast.success(m.game_invite_accepted({ name: fromUserName }))
	);
	room.onMessage(`${NOTIF_INVITE}_denied`, ({ fromUserName }: { fromUserName: string }) => {
		toast.warning(m.game_invite_denied({ name: fromUserName }));
		void goto(resolve('/'));
	});
}
