export class RESTManager {
	public readonly http: { api: string; version: number };
	public readonly requestTimeout: number;
	public readonly timeouts = new Set<NodeJS.Timeout>();
	public readonly token: string;
	public readonly tokenType: TokenType;

	public constructor(config: RESTOptions) {
		this.http = config.http;
		this.requestTimeout = config.requestTimeout ?? 2000;
		this.token = config.token;
		this.tokenType = config.tokenType ?? TokenType.BOT;
	}

	public get authorization(): string {
		return `${this.tokenType === TokenType.BOT ? 'Bot ' : ''}${this.token}`;
	}

	public clearTimeout(timeout: NodeJS.Timeout): void {
		this.timeouts.delete(timeout);
		return clearTimeout(timeout);
	}

	public setTimeout(callback: (...args: any[]) => void, delay: number, ...args: any[]): NodeJS.Timeout {
		const timeout = setTimeout(callback, delay, ...args);
		this.timeouts.add(timeout);
		return timeout;
	}
}

interface RESTOptions {
	http: {
		api: string;
		version: number;
	};
	requestTimeout?: number;
	token: string;
	tokenType?: TokenType;
}

const enum TokenType {
	BOT,
	USER,
}
