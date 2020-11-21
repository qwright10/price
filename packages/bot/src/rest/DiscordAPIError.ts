export class DiscordAPIError extends Error {
	public readonly method: string;
	public readonly path: string;
	public readonly code: number;
	public readonly httpStatus: number;

	public constructor(path: string, error: any, method: string, status: number) {
		super();
		const flattened = DiscordAPIError.flattenErrors(error.errors || error).join('\n');
		this.name = 'DiscordAPIError';
		this.message = error.message && flattened ? `${error.message}\n${flattened}` : error.message || flattened;

		this.method = method;
		this.path = path;
		this.code = error.code;
		this.httpStatus = status;
	}

	public static flattenErrors(obj: Record<string, any>, key = ''): string[] {
		let messages: string[] = [];

		for (const [k, v] of Object.entries(obj)) {
			if (k === 'message') continue;
			const newKey = key ? (isNaN(k as any) ? `${key}.${k}` : `${key}[${k}]`) : k;

			if (v._errors) {
				messages.push(`${newKey}: ${v._errors.map((e: any) => e.message).join(' ')}`);
			} else if (v.code || v.message) {
				messages.push(`${v.code ? `${v.code as string}: ` : ''}${v.message}`.trim());
			} else if (typeof v === 'string') {
				messages.push(v);
			} else {
				messages = messages.concat(this.flattenErrors(v, newKey));
			}
		}

		return messages;
	}
}
