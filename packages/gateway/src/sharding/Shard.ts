import { EventEmitter } from 'events';
import path from 'path';
import { ShardingManager } from './ShardingManager';
import { Worker } from 'worker_threads';
import { Utils } from '../Utils';

export class Shard extends EventEmitter {
	public readonly id: number;
	public readonly manager: ShardingManager;

	public readonly env: any;
	public ready = false;
	public worker: Worker | null = null;

	public constructor(manager: ShardingManager, id: number) {
		super();

		this.manager = manager;
		this.id = id;
		this.env = {
			...process.env,
			AMQP_CONN: this.manager.amqpConn,
			AMQP_GROUP: this.manager.amqpGroup,
			DISCORD_TOKEN: this.manager.token,
			SHARD_ID: this.id,
			SHARD_COUNT: this.manager.totalShards,
		};
	}

	public spawn(): Worker {
		if (this.worker) return this.worker;

		this.worker = new Worker(path.resolve(this.manager.file), { workerData: this.env })
			.on('message', this._onMessage.bind(this))
			.on('exit', this._onExit.bind(this));

		this.emit('spawn', this.worker);
		return this.worker;
	}

	public kill(): void {
		this.worker?.removeListener('exit', this._onExit);
		void this.worker?.terminate();
		this._onExit(false);
	}

	public async respawn(): Promise<Worker> {
		this.kill();
		await Utils.delayFor(500);
		return this.spawn();
	}

	public send(message: any): this {
		this.worker?.postMessage(message);
		return this;
	}

	private _onMessage(message: any): void {
		if (message) {
			if (message._meta) {
				Object.assign(this.env, { ...message.data });
				return;
			}

			if (message._ready) {
				this.ready = true;
				this.emit('ready');
				return;
			}

			if (message._disconnect) {
				this.ready = false;
				this.emit('disconnect');
				return;
			}

			if (message._reconnecting) {
				this.ready = false;
				this.emit('reconnecting');
			}
		}
	}

	private _onExit(respawn = this.manager.respawn): void {
		this.emit('death', this.worker);

		this.ready = false;
		this.worker = null;
		if (respawn) this.spawn();
	}
}
