import { BitField } from './BitField';

export const enum MessageFlagsFlags {
	CROSSPOSTED,
	IS_CROSSPOST,
	SUPPRESS_EMBEDS,
	SOURCE_MESSAGE_DELETED,
	URGENT,
}

export class MessageFlags extends BitField<MessageFlagsFlags> {
	public static readonly FLAGS = {
		[MessageFlagsFlags.CROSSPOSTED]: 1 << 0,
		[MessageFlagsFlags.IS_CROSSPOST]: 1 << 1,
		[MessageFlagsFlags.SUPPRESS_EMBEDS]: 1 << 2,
		[MessageFlagsFlags.SOURCE_MESSAGE_DELETED]: 1 << 3,
		[MessageFlagsFlags.URGENT]: 1 << 4,
	} as const;
}
