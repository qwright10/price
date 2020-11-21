import type { RawUser } from './User';

export interface RawEmoji {
	id: string | null;
	name: string | null;
	roles?: string[];
	user?: RawUser;
	require_colons?: boolean;
	managed?: boolean;
	animated?: boolean;
	available?: boolean;
}
