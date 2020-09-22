import { EventEmitter } from 'events';
import redis, { ClientOpts, RedisClient as RClient } from 'redis';

export class RedisClient extends EventEmitter {
	public readonly client: RClient;
	public readonly publisher: RClient;
	public readonly subscriber: RClient;

	public constructor(options?: ClientOpts) {
		super();
		this.client = redis.createClient(options);
		this.publisher = redis.createClient(options);
		this.subscriber = redis.createClient(options);

		this.client.on('error', (...args) => this.emit('error', ...args));
		this.publisher.on('error', (...args) => this.emit('error', ...args));
		this.subscriber.on('error', (...args) => this.emit('error', ...args));
	}

	public async get(key: string): Promise<string | null> {
		return new Promise((resolve, reject) => {
			this.client.get(key, (err, reply) => {
				if (err) reject(err);
				resolve(reply);
			});
		});
	}

	public async set(key: string, value: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.client.set(key, value, (err) => {
				if (err) reject(err);
				resolve(true);
			});
		});
	}

	public async delete(key: string): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			this.client.del(key, (err, num) => {
				if (err) reject(err);
				resolve(num);
			});
		});
	}

	public get clientID(): string {
		return this.client.connection_id.toString();
	}

	public async getLock(key: string): Promise<any> {
		return this.get(`lock:${key}`);
	}

	public async lock(key: string): Promise<boolean> {
		const lock = await this.getLock(key);
		if (lock && lock === this.clientID) return true;

		return this.set(`lock:${key}`, this.clientID[0]);
	}

	public async unlock(key: string): Promise<boolean> {
		const lock = await this.getLock(key);
		console.log(lock);
		if (lock === null || lock !== this.clientID) return false;
		const unlocked = await this.delete(`lock:${key}`);
		this.publisher.publish(`lock:${key}`, this.clientID[0]);
		return Boolean(unlocked);
	}

	public async waitUntilUnlock(key: string, max = 500): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			this.subscriber.subscribe(`release:${key}`);
			const timeout = setTimeout(() => resolve(false), max);

			const listener = (channel: string) => {
				if (channel !== `release:${key}`) return;
				this.client.removeListener('message', listener);
				clearTimeout(timeout);
				resolve(true);
			};

			this.client.addListener('message', listener);
		});
	}
}
