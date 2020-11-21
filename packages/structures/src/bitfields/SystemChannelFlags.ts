import { BitField } from './BitField';

export const enum SystemChannelFlagsFlags {
	WELCOME_MESSAGE_DISABLED,
	BOOST_MESSAGE_DISABLED,
}

export class SystemChannelFlags extends BitField<SystemChannelFlagsFlags> {
	public static readonly FLAGS = {
		[SystemChannelFlagsFlags.WELCOME_MESSAGE_DISABLED]: 1 << 0,
		[SystemChannelFlagsFlags.BOOST_MESSAGE_DISABLED]: 1 << 1,
	} as const;
}
