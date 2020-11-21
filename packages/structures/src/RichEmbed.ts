export class RichEmbed {
	private readonly data: RawRichEmbed;

	public constructor(data?: RawRichEmbed) {
		this.data = Object.assign(Object.create(RichEmbed.prototype), data);
	}

	public setTitle(title: string): this {
		this.data.title = title;
		return this;
	}

	public setDescription(description: string): this {
		this.data.description = description;
		return this;
	}

	public setURL(url: string): this {
		this.data.url = url;
		return this;
	}

	public setTimestamp(timestamp?: Date | number | string): this {
		this.data.timestamp = new Date(timestamp ?? Date.now()).toISOString();
		return this;
	}

	public setColor(color: number): this {
		this.data.color = color;
		return this;
	}

	public setFooter(text: string, iconURL?: string): this {
		this.data.footer = {
			text,
			icon_url: iconURL,
		};
		return this;
	}

	public setImage(url: string): this {
		this.data.image = { url };
		return this;
	}

	public setThumbnail(url: string): this {
		this.data.thumbnail = { url };
		return this;
	}

	public setVideo(url: string): this {
		this.data.video = { url };
		return this;
	}

	public setAuthor(name: string, url?: string): this {
		this.data.author = { name, url };
		return this;
	}

	public addField(name: string, value = '\u200b', inline = false): this {
		const fields = [...(this.data.fields ?? []), { name, value, inline }];
		this.data.fields = fields;
		console.log(this.data.fields);
		return this;
	}

	public addFields(...fields: { name: string; value?: string; inline?: boolean }[]): this {
		fields.forEach((f) => this.addField(f.name, f.value, f.inline));
		return this;
	}

	public valueOf(): RawRichEmbed {
		return Object.assign({ type: 'rich' }, this.data);
	}
}

export interface RawRichEmbed {
	title?: string;
	type?: string;
	description?: string;
	url?: string;
	timestamp?: string;
	color?: number;
	footer?: {
		text: string;
		icon_url?: string;
		proxy_icon_url?: string;
	};
	image?: {
		url?: string;
		proxy_url?: string;
		height?: number;
		width?: number;
	};
	thumbnail?: {
		url?: string;
		proxy_url?: string;
		height?: number;
		width?: number;
	};
	video?: {
		url?: string;
		height?: number;
		width?: number;
	};
	provider?: {
		name?: string;
		url?: string;
	};
	author?: {
		name?: string;
		url?: string;
		icon_url?: string;
		proxy_icon_url?: string;
	};
	fields?: {
		name: string;
		value: string;
		inline?: boolean;
	}[];
}
