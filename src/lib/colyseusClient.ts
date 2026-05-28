import { Client, Room } from '@colyseus/sdk';

const COLYSEUS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws';
const COLYSEUS_URL = `${COLYSEUS_PROTOCOL}://${window.location.host}`;

export const colyseusClient = new Client(COLYSEUS_URL);

