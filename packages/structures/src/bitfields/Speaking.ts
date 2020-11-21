import { BitField } from './BitField';

export const enum SpeakingFlags {
	SPEAKING,
	SOUND_SHARE,
	PRIORITY_SPEAKING,
}

export class Speaking extends BitField<SpeakingFlags> {
	public static readonly FLAGS = {
		[SpeakingFlags.SPEAKING]: 1 << 0,
		[SpeakingFlags.SOUND_SHARE]: 1 << 1,
		[SpeakingFlags.PRIORITY_SPEAKING]: 1 << 2,
	} as const;
}
