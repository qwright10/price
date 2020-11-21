const kCode = Symbol('code');
const messages = new Map<string, ((...args: any[]) => string) | string>();

export function makePriceError(Base: ErrorConstructor) {
	return class PriceError extends Base {
		public readonly [kCode]: string;

		public constructor(key: string, ...args: any[]) {
			super(message(key, args));
			this[kCode] = key;
			Error.captureStackTrace(this, PriceError);
		}

		public get name(): string {
			return `${super.name} [${this[kCode]}]`;
		}

		public get code(): string {
			return this[kCode];
		}
	};
}

function message(key: string, args?: any[]) {
	if (typeof key !== 'string') throw globalThis.Error('Error message key must be a string');
	const msg = messages.get(key);
	if (!msg) throw globalThis.Error(`An invalid error message key was used: ${key}.`);
	if (typeof msg === 'function') return msg(...(args ?? []));
	if (args === undefined || args.length === 0) return msg;
	args.unshift(msg);
	return String(...args);
}

export function register(sym: string, val: any) {
	messages.set(sym, typeof val === 'function' ? val : String(val));
}

export const Error = makePriceError(globalThis.Error);
export const TypeError = makePriceError(globalThis.TypeError);
export const RangeError = makePriceError(globalThis.RangeError);
