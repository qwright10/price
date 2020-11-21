import { Base } from './Base';
import { MessageFlags } from './bitfields/MessageFlags';
import { RichEmbed } from './RichEmbed';

export class Message<Client> extends Base<Client> {
	public author!: RawUser;
	public attachments!: RawAttachment[];
	public activity!: RawMessageActivity | null;
	public application!: RawMessageApplication | null;
	public channelID!: string;
	public content!: string;
	public deleted = false;
	public editedAt!: Date | null;
	public embeds!: RawEmbed[];
	public flags!: MessageFlags;
	public guildID!: string | null;
	public member!: RawPartialMember | null;
	public mentionsEveryone!: boolean;
	public mentions!: RawMention[];
	public nonce!: number | string | null;
	public pinned!: boolean;
	public reactions!: RawMessageReaction[];
	public reference!: RawMessageReference | null;
	public sentAt!: Date;
	public tts!: boolean;
	public type!: MessageTypes;
	public webhookID!: string | null;

	public constructor(client: Client, data: RawMessage) {
		super(client);
		this.id = BigInt(data.id);

		this._patch(data);
	}

	public _patch(data: any) {
		this.content = data.content!;
		this.embeds = data.embeds!;
		this.flags = new MessageFlags(data.flags);
		this.channelID = data.channel_id;
		this.guildID = data.guild_id ?? null;
		this.author = data.author;
		this.member = data.member ?? null;
		this.sentAt = new Date(data.timestamp);
		this.editedAt = data.edited_timestamp ? new Date(data.edited_timestamp) : null;
		this.tts = data.tts;
		this.mentionsEveryone = data.mention_everyone;
		this.mentions = data.mentions;
		this.attachments = data.attachments;
		this.reactions = data.reactions ?? [];
		this.nonce = data.nonce ?? null;
		this.pinned = data.pinned;
		this.webhookID = data.webhook_id ?? null;
		this.type = data.type;
		this.activity = data.activity ?? null;
		this.application = data.application ?? null;
		this.reference = data.message_reference ?? null;
	}

	public suppressEmbeds(): Promise<this> {
		return (this.client as any).api
			.channels(this.channelID)
			.messages(this.id)
			.patch({
				data: {
					flags: 4,
				},
			})
			.then((r: RawMessage) => {
				this._patch(r);
				return this;
			});
	}

	public reply(content: string | null, embed?: RichEmbed): Promise<Message<Client>> {
		return (this.client as any).api
			.channels(this.channelID)
			.messages.post({
				data: {
					content: String(content ?? ''),
					embed: embed?.valueOf(),
				},
			})
			.then((r: RawMessage) => new Message(this.client, r));
	}

	public edit(content: string): Promise<this> {
		return (this.client as any).api
			.channels(this.channelID)
			.messages(this.id)
			.patch({
				data: {
					content,
				},
			})
			.then((r: RawMessage) => {
				this._patch(r);
				return this;
			});
	}

	public delete(): Promise<this> {
		return (this.client as any).api
			.channels(this.channelID)
			.messages(this.id)
			.delete()
			.then(() => {
				this.deleted = true;
				return this;
			});
	}

	public get url(): string {
		return `https://discord.com/channels/${this.guildID ?? '@me'}/${this.channelID}/${this.id}`;
	}
}

enum MessageTypes {
	DEFAULT,
	RECIPIENT_ADD,
	RECIPIENT_REMOVE,
	CALL,
	CHANNEL_NAME_CHANGE,
	CHANNEL_ICON_CHANGE,
	CHANNEL_PINNED_MESSAGE,
	GUILD_MEMBER_JOIN,
	USER_PREMIUM_GUILD_SUBSCRIPTION,
	USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1,
	USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2,
	USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3,
	CHANNEL_FOLLOW_ADD,
	GUILD_DISCOVERY_DISQUALIFIED,
	GUILD_DISCOVERY_REQUALIFIED,
}

export interface RawMessage {
	id: string;
	channel_id: string;
	guild_id?: string;
	author: RawUser;
	member?: RawPartialMember;
	content: string;
	timestamp: string;
	edited_timestamp?: string;
	tts: boolean;
	mention_everyone: boolean;
	mentions: RawMention[];
	mention_roles: string[];
	mention_channels?: RawChannelMention[];
	attachments: RawAttachment[];
	embeds: RawEmbed[];
	reactions?: RawMessageReaction[];
	nonce?: number | string;
	pinned: boolean;
	webhook_id?: string;
	type: number;
	activity?: RawMessageActivity;
	application?: RawMessageApplication;
	message_reference?: RawMessageReference;
	flags?: number;
}

type RawMention = User & { member?: RawMentionMember };

interface RawMessageActivity {
	type: 1 | 2 | 3 | 5;
	party_id?: string;
}

interface RawMessageApplication {
	id: string;
	cover_image?: string;
	description: string;
	icon: string | null;
	name: string;
}

interface RawMessageReference {
	message_id?: string;
	channel_id: string;
	guild_id?: string;
}

interface RawMessageReaction {
	count: number;
	me: boolean;
	emoji: RawReactionEmoji;
}

interface RawReactionEmoji {
	id: string | null;
	name: string | null;
	roles?: string[];
	user?: RawUser;
	require_colons?: boolean;
	managed?: boolean;
	animated?: boolean;
	available?: boolean;
}

interface RawEmbed {
	title?: string;
	type?: 'rich' | 'image' | 'video' | 'gifv' | 'article' | 'link';
	description?: string;
	url?: string;
	timestamp?: string;
	color?: number;
	footer?: RawEmbedFooter;
	image?: RawEmbedImage;
	thumbnail?: RawEmbedThumbnail;
	video?: RawEmbedVideo;
	provider?: RawEmbedProvider;
	author?: RawEmbedAuthor;
	fields?: RawEmbedField[];
}

interface RawEmbedFooter {
	text: string;
	icon_url?: string;
	proxy_icon_url?: string;
}

interface RawEmbedImage {
	url?: string;
	proxy_url?: string;
	height?: number;
	width?: number;
}

interface RawEmbedThumbnail {
	url?: string;
	proxy_url?: string;
	height?: number;
	width?: number;
}

interface RawEmbedVideo {
	url?: string;
	height?: number;
	width?: number;
}

interface RawEmbedProvider {
	name?: string;
	url?: string;
}

interface RawEmbedAuthor {
	name?: string;
	url?: string;
	icon_url?: string;
	proxy_icon_url?: string;
}

interface RawEmbedField {
	name: string;
	value: string;
	inline?: boolean;
}

interface RawAttachment {
	id: string;
	filename: string;
	size: number;
	url: string;
	proxy_url: string;
	height: number | null;
	width: number | null;
}

interface RawChannelMention {
	id: string;
	guild_id: string;
	type: number;
	name: string;
}

interface RawMentionMember {
	roles: string[];
	joined_at: string;
	premium_since?: string | null;
	deaf: boolean;
	mute: boolean;
}

interface RawPartialMember {
	// user not sent with partial message_create/_update
	nick: string | null;
	roles: string[];
	joined_at: string;
	premium_since?: string | null;
	deaf: boolean;
	mute: boolean;
}

interface RawUser {
	id: string;
	username: string;
	discriminator: string;
	avatar: string | null;
	bot?: boolean;
	system?: boolean;
	public_flags?: number;
}

interface User {
	id: string; // sent
	username: string; // sent
	discriminator: string; // sent
	avatar: string | null; // sent
	bot: boolean; // not sent or true
	system: boolean; // not sent or true
	public_flag: number; // not sent or undefined
}
