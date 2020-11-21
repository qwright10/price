import { EventEmitter } from 'events';
import { Shard } from './Shard';
import { Utils } from '@price/utils';
import { filename } from '../GatewayDelegate';

export class ShardingManager extends EventEmitter {
	public readonly file: string;
	public readonly shards = new Map<number, Shard>();

	public readonly options: ShardingManagerOptions;
	public totalShards: number | 'auto';
	public gatewayURL: string | null = null;

	public constructor(options: ShardingManagerOptions) {
		super();

		this.file = filename;
		this.totalShards = options.gateway.shards;
		this.options = options;
	}

	public createShard(id = this.shards.size) {
		const shard = new Shard(this, id);
		this.shards.set(id, shard);
		this.emit('shardCreate', shard);
		return shard;
	}

	public async spawn(): Promise<Map<number, Shard>> {
		const gateway = await Utils.fetchGateway(this.options.gateway.token);
		this.gatewayURL = gateway.url;

		if (this.totalShards === 'auto') this.totalShards = gateway.shards;
		if (!this.totalShards) {
			console.error('Cannot spawn undefined shards');
			process.exit(1);
		}

		console.log('Spawning', this.totalShards, 'shards');
		for (let id = 0; id < this.totalShards; id++) {
			const shard = this.createShard(id);
			shard.spawn();
			await Utils.delayFor(5000);
		}

		return this.shards;
	}
}

export interface ShardingManagerOptions {
	amqp: {
		conn: string;
		group: string;
	};
	gateway: {
		intents?: number;
		respawn: boolean;
		shards: number | 'auto';
		token: string;
	};
}
