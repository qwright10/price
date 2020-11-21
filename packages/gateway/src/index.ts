import { ShardingManager } from './sharding/ShardingManager';
import { join } from 'path';
import { parse } from 'toml';
import { readFileSync } from 'fs';
import { Utils } from '@price/utils';

(() => {
	const path = join(process.cwd(), 'config.toml');
	const config = parse(readFileSync(path, 'utf-8'));

	const types = {
		amqp: {
			conn: 'string',
			group: 'string',
		},
		gateway: {
			intents: 'number|undefined',
			respawn: 'boolean',
			shards: 'number|string',
			token: 'string',
		},
	};

	if (!Utils.checkTypes(config, types)) {
		console.error('Config types do not match expected types:', config, types);
		process.exit(1);
	}

	void new ShardingManager(config).on('spawn', ({ id }) => console.log('Shard spawned:', id)).spawn();
})();
