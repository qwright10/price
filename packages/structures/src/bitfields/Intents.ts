import { BitField } from './BitField';

export enum IntentsFlags {
	GUILDS,
	GUILD_MEMBERS,
	GUILD_BANS,
	GUILD_EMOJIS,
	GUILD_INTEGRATIONS,
	GUILD_WEBHOOKS,
	GUILD_INVITES,
	GUILD_VOICE_STATES,
	GUILD_PRESENCES,
	GUILD_MESSAGES,
	GUILD_MESSAGE_REACTIONS,
	GUILD_MESSAGE_TYPING,
	DIRECT_MESSAGES,
	DIRECT_MESSAGE_REACTIONS,
	DIRECT_MESSAGE_TYPING,
	ALL,
	PRIVILEGED,
	UNPRIVILEGED,
}

export class Intents extends BitField<IntentsFlags> {
	public static readonly FLAGS = {
		[IntentsFlags.GUILDS]: 1 << 0,
		[IntentsFlags.GUILD_MEMBERS]: 1 << 1,
		[IntentsFlags.GUILD_BANS]: 1 << 2,
		[IntentsFlags.GUILD_EMOJIS]: 1 << 3,
		[IntentsFlags.GUILD_INTEGRATIONS]: 1 << 4,
		[IntentsFlags.GUILD_WEBHOOKS]: 1 << 5,
		[IntentsFlags.GUILD_INVITES]: 1 << 6,
		[IntentsFlags.GUILD_VOICE_STATES]: 1 << 7,
		[IntentsFlags.GUILD_PRESENCES]: 1 << 8,
		[IntentsFlags.GUILD_MESSAGES]: 1 << 9,
		[IntentsFlags.GUILD_MESSAGE_REACTIONS]: 1 << 10,
		[IntentsFlags.GUILD_MESSAGE_TYPING]: 1 << 11,
		[IntentsFlags.DIRECT_MESSAGES]: 1 << 12,
		[IntentsFlags.DIRECT_MESSAGE_REACTIONS]: 1 << 13,
		[IntentsFlags.DIRECT_MESSAGE_TYPING]: 1 << 14,
		[IntentsFlags.ALL]: 32767,
		[IntentsFlags.PRIVILEGED]: 258,
		[IntentsFlags.UNPRIVILEGED]: 32509,
	} as const;
}
