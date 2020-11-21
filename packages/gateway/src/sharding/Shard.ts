import { EventEmitter } from 'events';
import { ShardingManager } from './ShardingManager';
import { Utils } from '@price/utils';
import { ChildProcess, fork } from 'child_process';
import { Intents, IntentsFlags } from '@price/structures';

export class Shard extends EventEmitter {
	public readonly id: number;
	public readonly manager: ShardingManager;

	public readonly env: any;
	public readonly intents: number;
	public ready = false;
	public child: ChildProcess | null = null;

	public constructor(manager: ShardingManager, id: number) {
		super();

		this.manager = manager;
		this.id = id;
		this.intents = manager.options.gateway.intents ?? Intents.FLAGS[IntentsFlags.UNPRIVILEGED];
		this.env = {
			...process.env,
			START_WORKER: true,
			GATEWAY_OPTIONS: JSON.stringify({
				amqp: this.manager.options.amqp,
				gateway: {
					intents: this.intents,
					shard: [this.id, this.manager.totalShards],
					token: this.manager.options.gateway.token,
					url: this.manager.gatewayURL,
				},
			}),
		};
	}

	public spawn(): ChildProcess {
		if (this.child) return this.child;

		this.child = fork(this.manager.file, { env: this.env })
			.on('message', this._onMessage.bind(this))
			.on('exit', this._onExit.bind(this));

		this.emit('spawn', this.child);
		return this.child;
	}

	public kill(): void {
		this.child?.removeListener('exit', this._onExit);
		void this.child?.kill();
		this._onExit(false);
	}

	public async respawn(): Promise<ChildProcess> {
		this.kill();
		await Utils.delayFor(500);
		return this.spawn();
	}

	public send(message: any): this {
		this.child?.send(message);
		return this;
	}

	private _onExit(respawn = this.manager.options.gateway.respawn): void {
		this.emit('death', this.child);

		this.ready = false;
		this.child = null;
		if (respawn) this.spawn();
	}

	private _onMessage(message: string): void {
		console.log(message);
	}
}
