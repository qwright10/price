import { EventEmitter } from 'events';
import { EventConsumer } from './EventConsumer';

export class TrapConsumer extends EventEmitter {
	private readonly consumer: EventConsumer;
	public readonly key: string;

	public constructor(consumer: EventConsumer, key: string) {
		super();

		this.consumer = consumer;
		this.key = key;
	}

	public onMessage(event: string): void {
		if (event === 'END') {
			console.log('Trap ended');
			this.emit('end');
			return;
		}

		this.emit('data', event);
	}
}
