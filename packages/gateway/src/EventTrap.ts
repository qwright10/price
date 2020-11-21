import { EventEmitter } from 'events';
import { GatewayDelegate } from './GatewayDelegate';

export class EventTrap extends EventEmitter {
	private readonly timeout: NodeJS.Timeout;

	public constructor(
		public readonly gateway: GatewayDelegate,
		public readonly conditions: [string, { [key: string]: any }],
		public readonly duration: number,
		public readonly key: string,
	) {
		super();

		this.timeout = setTimeout(() => this.stop(), duration);
		console.log('Issued new event trap with key:', key);
	}

	public stop(): void {
		clearTimeout(this.timeout);
		this.gateway.publishTrapMessage(this.key, 'END');
		this.emit('end');
	}

	public runTrap(event: string, data: Record<string, any>): boolean {
		if (this.conditions[0] !== event) return false;
		for (const [key, value] of Object.entries(this.conditions[1])) if (data[key] !== value) return false;
		return true;
	}
}
