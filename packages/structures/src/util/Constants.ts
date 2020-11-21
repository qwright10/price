import { Error, RangeError } from './errors';

const AllowedImageFormats = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
type AllowedImageFormats = 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif';
const AllowedImageSizes = Array.from({ length: 9 }, (_, i: number) => 2 ** (i + 4));

export const Endpoints = {
	CDN(root: string) {
		return {
			Emoji: (emojiID: string, format = 'png') => `${root}/emojis/${emojiID}.${format}`,
			Asset: (name: string) => `${root}/assets/${name}`,
			DefaultAvatar: (discriminator: any) => `${root}/embed/avatars/${discriminator}.png`,
			Avatar: (userID: string, hash: string, format: AllowedImageFormats = 'webp', size: number, dynamic = false) => {
				if (dynamic) format = hash.startsWith('a_') ? 'gif' : format;
				return makeImageURL(`${root}/avatars/${userID}/${hash}`, { format, size });
			},
			Banner: (guildID: string, hash: string, format: AllowedImageFormats = 'webp', size: number) =>
				makeImageURL(`${root}/banners/${guildID}/${hash}`, { format, size }),
			Icon: (guildID: string, hash: string, format: AllowedImageFormats = 'webp', size: number, dynamic = false) => {
				if (dynamic) format = hash.startsWith('a_') ? 'gif' : format;
				return makeImageURL(`${root}/icons/${guildID}/${hash}`, { format, size });
			},
			AppIcon: (
				clientID: string,
				hash: string,
				{ format = 'webp', size }: { format?: AllowedImageFormats; size?: number } = {},
			) => makeImageURL(`${root}/app-icons/${clientID}/${hash}`, { format, size }),
			AppAsset: (
				clientID: string,
				hash: string,
				{ format = 'webp', size }: { format?: AllowedImageFormats; size?: number } = {},
			) => makeImageURL(`${root}/app-assets/${clientID}/${hash}`, { format, size }),
			GDMIcon: (
				channelID: string,
				hash: string,
				{ format = 'webp', size }: { format?: AllowedImageFormats; size: number },
			) => makeImageURL(`${root}/channel-icons/${channelID}/${hash}`, { format, size }),
			Splash: (
				guildID: string,
				hash: string,
				{ format = 'webp', size }: { format?: AllowedImageFormats; size: number },
			) => makeImageURL(`${root}/splashes/${guildID}/${hash}`, { format, size }),
			DiscoverySplash: (
				guildID: string,
				hash: string,
				{ format = 'webp', size }: { format?: AllowedImageFormats; size: number },
			) => makeImageURL(`${root}/discovery-splashes/${guildID}/${hash}`, { format, size }),
			TeamIcon: (
				teamID: string,
				hash: string,
				{ format = 'webp', size }: { format?: AllowedImageFormats; size?: number } = {},
			) => makeImageURL(`${root}/team-icons/${teamID}/${hash}`, { format, size }),
		};
	},
	invite: (root: string, code: string) => `${root}/${code}`,
	botGateway: '/gateway/bot',
};

export const Events = {
	RATELIMIT: Symbol('RATELIMIT'),
};

function makeImageURL(
	root: string,
	{ format = 'webp', size }: { format?: AllowedImageFormats; size?: number } = {},
): string {
	if (!AllowedImageFormats.includes(format)) throw new Error('IMAGE_FORMAT', format);
	if (size && !AllowedImageSizes.includes(size)) throw new RangeError('IMAGE_SIZE', size);
	return `${root}.${format}${size ? `?size=${size}` : ''}`;
}

export const UserAgent = '@price/bot v1';
