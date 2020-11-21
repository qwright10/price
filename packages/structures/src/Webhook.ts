import { Base } from './Base';
import { RawMessage } from './Message';
import { RichEmbed } from './RichEmbed';
import { RawUser } from './User';

export class Webhook<Client> extends Base<Client> {
	public readonly client!: Client;
	public deleted = false;
	public readonly type: WebhookType;
	public readonly guildID: bigint | null;
	public channelID!: bigint;
	public readonly user?: RawUser;
	public name!: string | null;
	public avatar!: string | null;
	public readonly token?: string;
	public readonly applicationID: string | null;

	public constructor(client: Client, data: RawWebhook) {
		super(client);
		this.id = BigInt(data.id);
		this.type = data.type;
		this.guildID = data.guild_id ? BigInt(data.guild_id) : null;
		this.user = data.user;
		this.token = data.token;
		this.applicationID = data.application_id;

		this._patch(data);
	}

	public _patch(data: Partial<Pick<RawWebhook, 'avatar' | 'name' | 'channel_id'>>) {
		if ('name' in data) this.name = data.name!;
		if ('avatar' in data) this.avatar = data.avatar!;
		if ('channel_id' in data) this.channelID = BigInt(data.channel_id);
	}

	public delete(): Promise<this> {
		return (this.client as any).api
			.webhooks(this.id.toString())
			.delete()
			.then(() => {
				this.deleted = true;
				return this;
			});
	}

	public edit(data: { name?: string; avatar?: string | null; channel?: bigint } = {}): Promise<this> {
		const obj = { ...data, channel: data.channel ? data.channel.toString() : undefined };
		return (this.client as any).api
			.webhooks(this.id.toString())
			.patch({ data: obj })
			.then((r: RawWebhook) => {
				this._patch(r);
				return this;
			});
	}

	public send(content: string | null, embeds?: RichEmbed | RichEmbed[]): Promise<RawMessage> {
		if (embeds && !Array.isArray(embeds)) embeds = [embeds];
		return (this.client as any).api
			.webhooks(this.id.toString())(this.token)
			.post({ data: { content: String(content ?? ''), embeds }, query: { wait: true } });
	}

	public static create<Client>(
		client: Client,
		channel: bigint,
		name: string,
		avatar?: string,
	): Promise<Webhook<Client> | null> {
		return (client as any).api
			.channels(channel.toString())
			.webhooks.post({ data: { name, avatar: avatar ?? undefined } })
			.then((r: RawWebhook) => new Webhook(client, r))
			.catch(() => null);
	}

	public static fetch<Client>(client: Client, id: bigint): Promise<Webhook<Client> | null> {
		return (client as any).api
			.webhooks(id.toString())
			.get()
			.then((r: RawWebhook) => new Webhook(client, r))
			.catch(() => null);
	}
}

export interface RawWebhook {
	id: string;
	type: WebhookType;
	guild_id?: string;
	channel_id: string;
	user?: RawUser;
	name: string | null;
	avatar: string | null;
	token?: string;
	application_id: string | null;
}

export enum WebhookType {
	Incoming = 1,
	ChannelFollower,
}
