import { Base } from '../Base';

export class BaseManager<Client, Holds extends Base<Client>> {
	public readonly client: Client;
	public readonly cache = new Map<bigint, Holds>();
	private readonly holds: Holds;

	public constructor(client: Client, holds: Holds) {
		this.client = client;
		this.holds = holds;
	}

	public add(item: Holds): Holds {
		const stale = this.cache.get(item.id);
		if (stale) {
			stale._patch(item);
			return stale;
		}

		const entry = new (this.holds as any)(this.client, item);
		this.cache.set(item.id, item);
		return entry;
	}

	public resolve(key: bigint): Holds | null {
		return this.cache.get(key) ?? null;
	}

	public resolveID(item: Holds): bigint {
		return item.id;
	}
}
