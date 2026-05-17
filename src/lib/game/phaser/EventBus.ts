import { Events } from 'phaser';

export interface IEventBus {
	on(event: string, fn: (...args: unknown[]) => void): void;
	off(event: string, fn: (...args: unknown[]) => void): void;
	emit(event: string, ...args: unknown[]): void;
}

export const EventBus: IEventBus = new Events.EventEmitter();
