import { BaseClient } from '../BaseClient';
import { Amqp } from '@spectacles/brokers';
import * as Handlers from './events';
import { RedisClient } from 'redis';
import { EventEmitter } from 'events';
import { TrapConsumer } from './TrapConsumer';
import { Logger } from '@price/utils';

export class EventConsumer extends EventEmitter {
	public readonly client: BaseClient;
	public readonly broker = new Amqp('gateway');
	private readonly trapSubscriber = new RedisClient({ port: 6379 });
	private readonly traps = new Map<string, TrapConsumer>();
	private readonly conn: string;

	public constructor(client: BaseClient, conn: string) {
		super();
		this.client = client;
		this.conn = conn;
	}

	public async createTrap(conditions: { [key: string]: any }, duration: number): Promise<TrapConsumer> {
		const payload = {
			type: 'dispatch',
			trap: { conditions, duration },
			data: {},
		};

		const response = await this.broker.call('gateway_upstream', JSON.stringify(payload));
		const trap = new TrapConsumer(this, response.key);
		this.traps.set(trap.key, trap);
		return trap;
	}

	public async connect(): Promise<void> {
		this.broker.on('gateway_downstream', this._onDispatch.bind(this));
		await this.broker.connect(this.conn);
		await this.broker.subscribe('gateway_downstream');
		await this.broker.createQueue('gateway_downstream');
		await this.broker.createQueue('gateway_upstream');
		this.emit('ready');
	}

	private _onDispatch({ event, data }: { event: string; data: any }, { ack }: any): void {
		ack();

		Logger.gateway`${event.padEnd(25, ' ')} ${new Date()} (${Date.now()})`;
		if ((Handlers as any)[event]) return (Handlers as any)[event](data, this.client);
	}
}
