import { Base } from './Base';
import type { RawRole } from './Role';
import type { RawEmoji } from './Emoji';
import type { RawGuildMember } from './GuildMember';
import type { RawChannel } from './Channel';
import type { RawPresenceData } from './User';
import { SystemChannelFlags } from './bitfields/SystemChannelFlags';

export class Guild<Client> extends Base<Client> {
	public afkChannelID: string | null = null;
	public afkTimeout!: number;
	public applicationID: string | null = null;
	public approximateMemberCount: number | null = null;
	public approximatePresenceCount: number | null = null;
	public available = true;
	public banner: string | null = null;
	public channels: RawChannel[] = [];
	public defaultMessageNotifications!: DefaultMessageNotifications;
	public deleted = false;
	public description!: string | null;
	public discoverySplash!: string | null;
	public emojis: RawEmoji[] = [];
	public explicitContentFilter!: ExplicitContentFilterLevel;
	public features!: GuildFeature[];
	public icon!: string | null;
	public joinedAt!: Date | null;
	public large!: boolean | null;
	public maxMembers!: number | null;
	public maxPresences!: number | null;
	public maxVideoChannelUsers!: number | null;
	public memberCount!: number | null;
	public members: RawGuildMember[] = [];
	public mfaLevel!: MFALevel;
	public name!: string;
	public ownerID!: string;
	public preferredLocale!: string;
	public premiumSubscriptionCount!: number | null;
	public premiumTier!: PremiumTierLevel;
	public presences: RawPresenceData[] = [];
	public publicUpdatesChannelID!: string | null;
	public region!: string;
	public roles: RawRole[] = [];
	public rulesChannelID!: string | null;
	public splash!: string | null;
	public systemChannelID!: string | null;
	public systemChannelFlags = new SystemChannelFlags();
	public vanityURLCode!: string | null;
	public verificationLevel!: VerificationLevel;
	public voiceStates: Omit<RawVoiceState, 'guild_id'>[] = [];
	public widgetChannelID!: string | null;
	public widgetEnabled!: boolean;

	public constructor(client: Client, data: RawGuild) {
		super(client);

		this.id = BigInt(data.id);
		this.available = 'unavailable' in data ? data.unavailable! : true;

		this._patch(data);
	}

	public _patch(data: RawGuild) {
		this.name = data.name;
		this.icon = data.icon;
		this.splash = data.splash;
		this.discoverySplash = data.discovery_splash;
		this.ownerID = data.owner_id;
		this.region = data.region;
		this.afkChannelID = data.afk_channel_id;
		this.afkTimeout = data.afk_timeout;
		this.verificationLevel = data.verification_level;
		this.defaultMessageNotifications = data.default_message_notifications;
		this.explicitContentFilter = data.explicit_content_filter;
		this.roles = data.roles;
		this.emojis = data.emojis;
		this.features = data.features;
		this.mfaLevel = data.mfa_level;
		this.applicationID = data.application_id;
		this.widgetEnabled = data.widget_enabled ?? this.widgetEnabled;
		this.widgetChannelID = data.widget_channel_id ?? this.widgetChannelID;
		this.systemChannelID = data.system_channel_id;
		this.systemChannelFlags = this.systemChannelFlags.add(data.system_channel_flags);
		this.rulesChannelID = data.rules_channel_id;
		this.joinedAt = data.joined_at ? new Date(data.joined_at) : null;
		this.large = data.large ?? false;
		this.memberCount = data.member_count ?? this.memberCount;
		this.voiceStates = data.voice_states ?? [];
		this.members = data.members ?? this.members;
		this.channels = data.channels;
		this.presences = data.presences ?? this.presences;
		this.maxPresences = data.max_presences ?? this.maxPresences;
		this.maxMembers = data.max_members ?? this.maxMembers;
		this.vanityURLCode = data.vanity_url_code;
		this.description = data.description;
		this.banner = data.banner;
		this.premiumTier = data.premium_tier;
		this.premiumSubscriptionCount = data.premium_subscription_count ?? this.premiumSubscriptionCount;
		this.preferredLocale = data.preferred_locale;
		this.publicUpdatesChannelID = data.public_updates_channel_id;
		this.maxVideoChannelUsers = data.max_video_channel_users ?? this.maxVideoChannelUsers;
		this.approximateMemberCount = data.approximate_member_count ?? this.approximateMemberCount;
		this.approximatePresenceCount = data.approximate_presence_count ?? this.approximatePresenceCount;
	}
}

enum VerificationLevel {
	NONE,
	LOW,
	MEDIUM,
	HIGH,
	VERY_HIGH,
}

enum PremiumTierLevel {
	NONE,
	TIER_1,
	TIER_2,
	TIER_3,
}

enum MFALevel {
	NONE,
	ELEVATED,
}

enum DefaultMessageNotifications {
	ALL_MESSAGES,
	ONLY_MENTIONS,
}

enum ExplicitContentFilterLevel {
	DISABLED,
	MEMBERS_WITHOUT_ROLES,
	ALL_MEMBERS,
}

interface RawGuild {
	id: string;
	name: string;
	icon: string | null;
	splash: string | null;
	discovery_splash: string | null;
	owner?: boolean;
	owner_id: string;
	permissions?: number;
	permissions_new?: number;
	region: string;
	afk_channel_id: string | null;
	afk_timeout: number;
	verification_level: number;
	default_message_notifications: number;
	explicit_content_filter: number;
	roles: RawRole[];
	emojis: RawEmoji[];
	features: GuildFeature[];
	mfa_level: number;
	application_id: string | null;
	widget_enabled?: boolean;
	widget_channel_id?: string | null;
	system_channel_id: string | null;
	system_channel_flags: number;
	rules_channel_id: string | null;
	// begin only sent with GUILD_CREATE
	joined_at?: string;
	large?: boolean;
	unavailable?: boolean;
	member_count?: number;
	voice_states?: Omit<RawVoiceState, 'guild_id'>[];
	members?: RawGuildMember[];
	channels: RawChannel[];
	presences?: RawPresenceData[]; // partial somehow
	// end only sent with GUILD_CREATE
	max_presences?: number | null;
	max_members?: number;
	vanity_url_code: string | null;
	description: string | null;
	banner: string | null;
	premium_tier: number;
	premium_subscription_count?: number;
	preferred_locale: string;
	public_updates_channel_id: string | null;
	max_video_channel_users?: number;
	approximate_member_count?: number;
	approximate_presence_count?: number;
}

interface RawVoiceState {
	guild_id?: string;
	channel_id: string | null;
	user_id: string;
	member?: RawGuildMember;
	session_id: string;
	deaf: boolean;
	mute: boolean;
	self_deaf: boolean;
	self_mute: boolean;
	self_stream?: boolean;
	self_video: boolean;
	suppress: boolean;
}

type GuildFeature =
	| 'INVITE_SPLASH'
	| 'VIP_REGIONS'
	| 'VANITY_URL'
	| 'VERIFIED'
	| 'PARTNERED'
	| 'PUBLIC'
	| 'COMMERCE'
	| 'NEWS'
	| 'DISCOVERABLE'
	| 'FEATURABLE'
	| 'ANIMATED_ICON'
	| 'BANNER'
	| 'PUBLIC_DISABLED'
	| 'WELCOME_SCREEN_ENABLED';
