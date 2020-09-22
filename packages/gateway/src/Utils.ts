import fetch from 'node-fetch';

export class Utils {
	public static delayFor(time: number): Promise<void> {
		return new Promise<void>((r) => setTimeout(r, time));
	}

	public static encodeQuery(url: string, query: { [key: string]: any }): string {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(query)) params.append(key, String(value));
		return `${url}/?${params.toString()}`;
	}

	public static async fetchGateway(): Promise<GatewayObject>;
	public static async fetchGateway(token: string): Promise<GatewayBotObject>;
	public static async fetchGateway(token?: string): Promise<any> {
		const url = `https://discord.com/api/v6/gateway${token ? '/bot' : ''}`;
		const opts = token ? { headers: { authorization: `Bot ${token}` } } : {};
		const res = await fetch(url, opts).then((r) => r.json());

		if (!res.url) throw Error('Response did not include gateway URL');
		if (token && !res.session_start_limit) throw Error('Response did not include session start limit');
		if (token && !res.shards) throw Error('Response did not include shard count');

		return res;
	}
}

interface GatewayObject {
	url: string;
}
interface GatewayBotObject {
	url: string;
	shards: number;
	session_start_limit: {
		total: number;
		remaining: number;
		reset_after: number;
	};
}
