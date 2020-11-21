import { BitField } from './BitField';

export const enum ActivityFlagsFlags {
	INSTANCE,
	JOIN,
	SPECTATE,
	JOIN_REQUEST,
	SYNC,
	PLAY,
}

export class ActivityFlags extends BitField<ActivityFlagsFlags> {
	public static readonly FLAGS = {
		[ActivityFlagsFlags.INSTANCE]: 1 << 0,
		[ActivityFlagsFlags.JOIN]: 1 << 1,
		[ActivityFlagsFlags.SPECTATE]: 1 << 2,
		[ActivityFlagsFlags.JOIN_REQUEST]: 1 << 3,
		[ActivityFlagsFlags.SYNC]: 1 << 4,
		[ActivityFlagsFlags.PLAY]: 1 << 5,
	} as const;
}
