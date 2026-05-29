import { Client } from '@colyseus/sdk';
import { browser } from '$app/environment';

const COLYSEUS_URL = browser
	? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
	: null;

export const colyseusClient = COLYSEUS_URL
	? new Client(COLYSEUS_URL)
	: null;
