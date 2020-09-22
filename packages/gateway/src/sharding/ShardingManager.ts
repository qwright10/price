import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { Shard } from './Shard';
import { Utils } from '../Utils';

export class ShardingManager extends EventEmitter {
	public readonly file: string;
	public readonly shards = new Map<number, Shard>();

	public shardList: number[];
	public totalShards: number | 'auto';
	public readonly respawn: boolean;
	public readonly token: string;
	public readonly amqpConn: string;
	public readonly amqpGroup: string;

	public constructor(file: string, options: ShardingManagerOptions) {
		super();

		this.file = file;
		if (!file) throw Error('Invalid client option: file (expected a file)');
		if (!path.isAbsolute(file)) this.file = path.resolve(process.cwd(), file);
		const stats = fs.statSync(this.file);
		if (!stats.isFile()) throw Error('Invalid client option: file (expected a file)');

		this.shardList = options.shards === 'auto' ? [] : Array.from({ length: options.shards }, (_, i) => i);
		this.totalShards = options.shards;
		this.respawn = options.respawn;
		this.token = options.token.replace(/^Bot\s*/i, '');
		this.amqpConn = options.amqpConn;
		this.amqpGroup = options.amqpGroup ?? 'default';

		process.env.DISCORD_TOKEN = options.token;
	}

	public createShard(id = this.shards.size) {
		const shard = new Shard(this, id);
		this.shards.set(id, shard);
		this.emit('shardCreate', shard);
		return shard;
	}

	public async spawn(): Promise<Map<number, Shard>> {
		if (this.totalShards === 'auto') {
			const { shards } = await Utils.fetchGateway(this.token);
			this.totalShards = shards;
			this.shardList = Array.from({ length: shards }, (_, i) => i);
		}

		console.log('Spawning', this.totalShards, 'shards');
		for (const id of this.shardList) {
			const shard = this.createShard(id);
			shard.spawn();
			await Utils.delayFor(10000);
		}

		return this.shards;
	}
}

interface ShardingManagerOptions {
	amqpConn: string;
	amqpGroup?: string;
	respawn: boolean;
	shards: number | 'auto';
	token: string;
}
