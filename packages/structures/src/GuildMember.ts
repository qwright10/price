import type { RawUser } from './User';

export interface RawGuildMember {
	user?: RawUser;
	nick?: string | null;
	roles: string[];
	joined_at: string;
	premium_since?: string | null;
	deaf: boolean;
	mute: boolean;
}
