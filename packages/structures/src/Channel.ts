import type { RawUser } from './User';

export interface RawChannel {
	id: string;
	type: number;
	guild_id?: string;
	position?: number;
	permission_overwrites?: RawPermissionOverwrite[];
	name?: string;
	topic?: string | null;
	nsfw?: boolean;
	last_message_id?: string | null;
	bitrate?: number;
	user_limit?: number;
	rate_limit_per_user?: number;
	recipients?: RawUser[];
	icon?: string | null;
	owner_id?: string;
	application_id?: string;
	parent_id?: string | null;
	last_pin_timestamp?: string;
}

interface RawPermissionOverwrite {
	id: string;
	type: 'role' | 'member';
	allow: number;
	allow_new: string;
	deny: number;
	deny_new: string;
}
