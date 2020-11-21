import fetch from 'node-fetch';
import chalk from 'chalk';
import crypto from 'crypto';
import erlpack from 'erlpack';

type TypeObj = Record<string, any>;

export * from './Logger';

export class Utils {
	public static decode(data: ArrayBuffer | Buffer | string | any[], encoding: 'etf' | 'json' = 'json'): any {
		if (data instanceof ArrayBuffer) data = Buffer.from(data);
		else if (Array.isArray(data)) data = Buffer.concat(data);
		if (encoding === 'etf') {
			if (typeof data === 'string') data = Buffer.from(data);
			return erlpack.unpack(data as Buffer);
		}

		if (Buffer.isBuffer(data)) data = data.toString();
		else if (typeof data !== 'string') data = Buffer.from(data).toString();
		return JSON.parse(data);
	}

	public static asyncTimeout<T>(cb: () => T, timeout: number): Promise<T> {
		return new Promise((resolve) => {
			void this.delayFor(timeout).then(() => resolve(cb()));
		});
	}

	public static checkTypes(obj: any, target: TypeObj): boolean {
		if (!Object.keys(obj).every((v) => Object.keys(target).includes(v))) return false;

		for (const [key, value] of Object.entries(target)) {
			if (typeof value === 'string') {
				const values = value.split(/ ?\| ?/g);
				if (values.length > 1 && values.some((t) => typeof obj[key] === t)) continue;
			}

			if (typeof obj[key] === 'object' && value !== 'object' && this.checkTypes(obj[key], value)) continue;
			if (typeof obj[key] === value) continue;
			return false;
		}

		return true;
	}

	public static delayFor(time: number): Promise<void>;
	public static delayFor<T>(time: number, cb: () => T): Promise<T>;
	public static delayFor<T>(time: number, cb?: () => T): Promise<T | void> {
		return new Promise<T | void>((r) => setTimeout(() => (cb ? r(cb()) : r()), time));
	}

	public static encode(data: any, type: 'etf' | 'json' = 'json'): Buffer {
		if (type === 'etf') return erlpack.pack(data);
		return Buffer.from(JSON.stringify(data));
	}

	public static encodeQuery(url: string, query: { [key: string]: any }): URL {
		const [u, q] = url.split('?');
		if (q) query = { ...query, ...Object.fromEntries(q.split('&').map((p) => p.split('='))) };
		const params = new URLSearchParams(query);
		return new URL(`${u}?${params.toString()}`);
	}

	public static async fetchGateway(): Promise<GetGatewayObj>;
	public static async fetchGateway(token: string): Promise<GetGatewayBotObj>;
	public static async fetchGateway(token?: string): Promise<GetGatewayObj | GetGatewayBotObj> {
		const url = `https://discord.com/api/v6/gateway${token ? '/bot' : ''}`;
		const opts = token ? { headers: { authorization: `Bot ${token}` } } : {};
		const res = await fetch(url, opts).then((r) => r.json());

		if (!res.url) throw Error('Response did not include gateway URL');
		if (token && !res.session_start_limit) throw Error('Response did not include session start limit');
		if (token && !res.shards) throw Error('Response did not include shard count');

		return res;
	}

	public static generateKey(length = 60): string {
		return crypto.randomBytes(length).toString('base64');
	}

	public static log(message: string, tag: any = 'debug', additional: any = '') {
		const label = chalk.underline(chalk.blue(`${tag}:`));
		const msg = chalk.gray(message);
		const add = chalk.yellow(additional);
		process.stdout.write(`${label} ${msg} ${add}\n`);
	}

	public static mergeDefault<T extends Record<string, any>>(obj: any, def: T): T {
		for (const [key, value] of Object.entries(def)) {
			if (typeof obj[key] === 'undefined') obj[key] = value;
			else if (typeof obj[key] === 'object') obj[key] = this.mergeDefault(obj[key], def[key]);
		}

		return obj as T;
	}
}

interface GetGatewayObj {
	url: string;
}
interface GetGatewayBotObj {
	url: string;
	shards: number;
	session_start_limit: {
		total: number;
		remaining: number;
		reset_after: number;
	};
}
