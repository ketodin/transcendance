import { Room, type Client } from 'colyseus';
import { StatusState, FriendStatus } from './schema/StatusRoomState';
import { getFriendList } from '$lib/friends';
import { statusHub } from '$lib/game/colyseus/statusHub';
import { auth } from '$lib/server/auth';
import { type User } from 'better-auth/types';

export class StatusRoom extends Room<{ state: StatusState }> {
	state = new StatusState();
	userId = '';
	maxClients = 1;

	async onAuth(_client: Client, _options: unknown, ctx: { headers: Headers }) {
		const session = await auth.api.getSession({ headers: ctx.headers });
		if (!session?.user) throw new Error('Not authenticated');
		return session.user;
	}

	async onJoin(_client: Client, options: undefined, auth: User) {
		this.userId = auth.id;
		statusHub.bind(this.userId, this);

		const friends = await getFriendList(this.userId); // need to use this instead of non realtime sveltekit `query`

		for (const friend of friends) {
			if (friend.friendRequestStatus !== 'ACCEPTED') continue;

			const p = new FriendStatus();
			p.id = friend.id;
			p.online = statusHub.isOnline(friend.id);
			this.state.friends.set(friend.id, p);
		}

		await statusHub.setOnline(this.userId, true);
	}

	async onDrop(_client: Client, _code: number) {
		void _client;
		void _code;
		await statusHub.setOnline(this.userId, false);
		statusHub.unbind(this.userId);
	}

	async onLeave(_client: Client, _code: number) {
		void _client;
		void _code;
		//if (code == 4000) {
		await statusHub.setOnline(this.userId, false);
		statusHub.unbind(this.userId);
		//}
	}

	async onReconnect(_client: Client) {
		void _client;
		await statusHub.setOnline(this.userId, true);
	}
}
