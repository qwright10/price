import { Base } from './Base';
import { UserFlags } from './bitfields/UserFlags';
import type { RawEmoji } from './Emoji';

export class User<Client> extends Base<Client> {
	public avatar: string | null = null;
	public bot!: boolean;
	public discriminator!: string;
	public email: string | null = null;
	public flags!: UserFlags;
	public locale: string | null = null;
	public mfa: boolean | null = null;
	public premiumType!: PremiumTypes;
	public system!: boolean;
	public username!: string;
	public verified: boolean | null = null;

	public constructor(client: Client, data: RawUser) {
		super(client);

		this.id = BigInt(data.id);
		this._patch(data);
	}

	public _patch(data: any) {
		this.avatar = data.avatar!;
		this.discriminator = data.discriminator!;
		this.email = data.email!;
		this.locale = data.locale!;
		this.mfa = data.mfa_enabled!;
		this.premiumType = data.premium_type!;
		this.username = data.username!;
		this.bot = data.bot ?? false;
		this.flags = new UserFlags(data.flags ?? 0).add(data.public_flags ?? 0);
		this.system = data.system ?? false;
	}
}

export interface RawPresenceData {
	user: Pick<RawUser, 'id'>;
	roles: string[];
	game: RawActivity | null;
	guild_id: string;
	status: string;
	activities: RawActivity[];
	client_status: RawClientStatus;
	premium_since?: string | null;
	nick?: string | null;
}

interface RawClientStatus {
	desktop?: string;
	mobile?: string;
	web?: string;
}

interface RawActivity {
	name: string;
	type: number;
	url?: string | null;
	created_at: number;
	timestamps?: {
		start: number;
		end?: number;
	};
	application_id?: string;
	details?: string | null;
	state?: string | null;
	emoji?: RawEmoji | null;
	party?: RawParty;
	assets?: RawAssets;
	secrets?: RawSecrets;
	instance?: boolean;
	flags?: number;
}

interface RawSecrets {
	join?: string;
	spectate?: string;
	match?: string;
}

interface RawAssets {
	large_image?: string;
	large_text?: string;
	small_image?: string;
	small_text?: string;
}

interface RawParty {
	id?: string;
	animated?: boolean;
}

type RawUserUpdateData = RawUpdateData<
	RawUser,
	| 'avatar'
	| 'discriminator'
	| 'email'
	| 'flags'
	| 'public_flags'
	| 'locale'
	| 'mfa_enabled'
	| 'premium_type'
	| 'username'
	| 'verified'
>;
type RawUpdateData<Type, Props extends keyof Type> = Partial<Pick<Type, Props>>;

enum PremiumTypes {
	NONE = 0,
	NITRO_CLASSIC,
	NITRO,
}

export interface RawUser {
	id: string;
	username: string;
	discriminator: string;
	avatar: string | null;
	bot?: boolean;
	system?: boolean;
	mfa_enabled?: boolean;
	locale?: string;
	verified?: boolean;
	email?: string | null;
	flags?: number;
	premium_type?: number;
	public_flags?: number;
}
