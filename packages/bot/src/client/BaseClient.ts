import { EventEmitter } from 'events';
import { EventConsumer } from './gateway/EventConsumer';
import { Logger } from '@price/utils';
import { RESTManager } from '../rest/RESTManager';
// import { ChannelManager } from '../structures/managers/ChannelManager';

interface PriceClientOptions {
	http: {
		api: string;
		cdn: string;
		invite: string;
		version: number;
	};
	owner: bigint | bigint[];
	restRequestTimeout: number;
	restTimeOffset: number;
	retryLimit: number;
	token: string;
}

export abstract class BaseClient extends EventEmitter {
	public readonly immediates = new Set<NodeJS.Immediate>();
	public readonly intervals = new Set<NodeJS.Timeout>();
	public readonly timeouts = new Set<NodeJS.Timeout>();

	// public readonly channels = new ChannelManager(this, []);
	// public readonly guilds = new GuildManager(this, []);
	// public readonly users = new UserManager(this, []);

	public readonly gateway = new EventConsumer(this, 'localhost');
	public readonly rest = new RESTManager(this);

	private readonly _token: string;
	public readonly options: PriceClientOptions;

	public constructor(options: PriceClientOptions) {
		super();

		this._token = options.token;
		this.options = options;
	}

	public get api(): any {
		return this.rest.api;
	}

	public get token(): string {
		return this._token;
	}

	public async connect(): Promise<void> {
		await this.gateway.connect();
		Logger.CLIENT`Connected to gateway service`;
	}

	public clearImmediate(immediate: NodeJS.Immediate): void {
		this.immediates.delete(immediate);
		return clearImmediate(immediate);
	}

	public clearInterval(interval: NodeJS.Timeout): void {
		this.intervals.delete(interval);
		return clearInterval(interval);
	}

	public clearTimeout(timeout: NodeJS.Timeout): void {
		this.timeouts.delete(timeout);
		return clearTimeout(timeout);
	}

	public setImmediate(callback: (...args: any[]) => void): NodeJS.Immediate {
		const immediate = setImmediate(callback);
		this.immediates.add(immediate);
		return immediate;
	}

	public setInterval(callback: (...args: any[]) => void, delay: number): NodeJS.Timeout {
		const interval = setInterval(callback, delay);
		this.intervals.add(interval);
		return interval;
	}

	public setTimeout(callback: (...args: any[]) => void, delay: number): NodeJS.Timeout {
		const timeout = setTimeout(callback, delay);
		this.timeouts.add(timeout);
		return timeout;
	}
}
