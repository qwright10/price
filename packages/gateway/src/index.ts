import { ShardingManager } from './sharding/ShardingManager';
import toml from 'toml';
import fs from 'fs';

void (async () => {
	const options = toml.parse(fs.readFileSync(`${process.cwd()}/config.toml`).toString());

	const manager = new ShardingManager('build/start.js', {
		amqpConn: options.amqp.conn,
		amqpGroup: options.amqp.group,
		token: options.gateway.token,
		shards: options.gateway.shards,
		respawn: true,
	});
	manager.on('spawn', ({ id }) => console.log('Shard spawned:', id));
	await manager.spawn();
})();
