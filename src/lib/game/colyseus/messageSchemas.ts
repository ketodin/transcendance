import { z } from 'zod';
import { PROJECTILE_TYPES } from '$lib/game/shared/projectileTypes';

export const InputSchema = z.object({
	moveLeft: z.boolean(),
	moveRight: z.boolean()
});
export type InputMessage = z.infer<typeof InputSchema>;

export const FireDirectSchema = z.object({
	angle: z.number().finite(),
	power: z.number().finite().min(0).max(100)
});

export const SetTurretAngleSchema = z.object({
	angle: z.number().finite()
});

export const SelectWeaponSchema = z.object({
	index: z
		.number()
		.int()
		.min(0)
		.max(PROJECTILE_TYPES.length - 1)
});

export const ChatSchema = z.object({
	text: z.string().trim().min(1).max(80)
});

export const ReadySchema = z.union([z.undefined(), z.null(), z.object({}).strict()]);

export const RoomOptionsSchema = z.object({
	private: z.boolean().optional()
});
