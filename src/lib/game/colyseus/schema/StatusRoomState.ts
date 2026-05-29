import { Schema, MapSchema, type } from '@colyseus/schema';

export class FriendStatus extends Schema {
	@type('string') id = "";
	@type('boolean') online = false;
}

export class StatusState extends Schema {
	@type({ map: FriendStatus }) friends = new MapSchema<FriendStatus>();
}
