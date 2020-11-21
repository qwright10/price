import { BitField } from './BitField';

export const enum UserFlagsFlags {
	DISCORD_EMPLOYEE,
	DISCORD_PARTNER,
	HYPESQUAD_EVENTS,
	BUGHUNTER_LEVEL_1,
	HOUSE_BRAVERY,
	HOUSE_BRILLIANCE,
	HOUSE_BALANCE,
	EARLY_SUPPORTER,
	TEAM_USER,
	SYSTEM,
	BUGHUNTER_LEVEL_2,
	VERIFIED_BOT,
	VERIFIED_DEVELOPER,
}

export class UserFlags extends BitField<UserFlagsFlags> {
	public static readonly FLAGS = {
		[UserFlagsFlags.DISCORD_EMPLOYEE]: 1 << 0,
		[UserFlagsFlags.DISCORD_PARTNER]: 1 << 1,
		[UserFlagsFlags.HYPESQUAD_EVENTS]: 1 << 2,
		[UserFlagsFlags.BUGHUNTER_LEVEL_1]: 1 << 3,
		[UserFlagsFlags.HOUSE_BRAVERY]: 1 << 6,
		[UserFlagsFlags.HOUSE_BRILLIANCE]: 1 << 7,
		[UserFlagsFlags.HOUSE_BALANCE]: 1 << 8,
		[UserFlagsFlags.EARLY_SUPPORTER]: 1 << 9,
		[UserFlagsFlags.TEAM_USER]: 1 << 10,
		[UserFlagsFlags.SYSTEM]: 1 << 11,
		[UserFlagsFlags.BUGHUNTER_LEVEL_2]: 1 << 12,
		[UserFlagsFlags.VERIFIED_BOT]: 1 << 16,
		[UserFlagsFlags.VERIFIED_DEVELOPER]: 1 << 17,
	} as const;
}
