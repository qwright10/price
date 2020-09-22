import { EventEmitter } from 'events';
import { SocketClient, SocketEvents } from './SocketClient';
import { Amqp } from '@spectacles/brokers';
import { RedisClient } from '@price/cache';
import { workerData } from 'worker_threads';
import { Utils } from './Utils';
import zlib from 'zlib-sync';

export class GatewayDelegate extends EventEmitter {
	public readonly broker: Amqp = new Amqp(workerData.AMQP_GROUP);
	private brokerReady = false;
	public readonly redis = new RedisClient();

	private hasACKed = true;
	private heartbeatInterval?: NodeJS.Timeout;
	private readonly shard: [number, number] = [0, 1];

	private lastSeq: number | null = null;
	private closeSeq: number | null = null;
	private sessionID: string | null = null;
	private readonly expectedGuilds = new Set<string>();
	private readonly guilds = new Map<string, any>();

	private shouldResume = false;
	private gatewayURL?: string;
	private readonly socket = new SocketClient();
	private readonly inflate = new zlib.Inflate({
		chunkSize: 65535,
		to: 'string',
	});

	public constructor(private readonly token: string) {
		super();
		this.socket.on(SocketEvents.ERROR, console.error);
		this.socket.on(SocketEvents.CLOSE, this.onClose.bind(this));
		this.socket.on(SocketEvents.MESSAGE, this.onMessage.bind(this));

		const { SHARD_ID: sid, SHARD_COUNT: sc } = workerData;
		if (sid !== undefined && sc !== undefined) this.shard = [sid, sc];
	}

	public async connect(): Promise<this> {
		if (!this.brokerReady) {
			await this.broker.connect(workerData.AMQP_CONN!);
			await this.broker.createQueue('dispatch');
			this.brokerReady = true;
		}

		this.gatewayURL =
			this.gatewayURL ??
			Utils.encodeQuery((await Utils.fetchGateway()).url, { v: 6, encoding: 'json', compress: 'zlib-stream' });
		this.socket.connect(this.gatewayURL);
		console.log('Connected to gateway');
		return this;
	}

	public destroy(
		{ code, reconnect }: { code: CloseCodes; reconnect: boolean } = {
			code: CloseCodes.NORMAL_CLOSURE,
			reconnect: false,
		},
	): void {
		console.log('Destroyed with code', CloseCodes[code]);
		this.closeSeq = this.lastSeq;
		this.lastSeq = null;
		if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

		this.socket.close(code);
		if (reconnect) {
			void this.connect();
			return console.log('Reconnecting');
		}

		console.log('Not reconnecting');
		return process.exit(1);
	}

	public heartbeat(force = false): void {
		if (!this.hasACKed && !force) {
			this.shouldResume = true;
			return this.destroy({ code: CloseCodes.SESSION_TIMED_OUT, reconnect: true });
		}

		return this.socket.send({
			op: OPCodes.HEARTBEAT,
			d: this.lastSeq,
		});
	}

	public identify(): void {
		if (this.shouldResume && this.sessionID) {
			this.shouldResume = false;
			return this.socket.send({
				op: OPCodes.RESUME,
				d: {
					token: this.token,
					session_id: this.sessionID,
					seq: this.closeSeq ?? this.lastSeq,
				},
			});
		}

		return this.socket.send({
			op: OPCodes.IDENTIFY,
			d: {
				token: this.token,
				properties: {
					$os: process.release,
					$browser: '@price/gateway v1.0.0',
					$device: '@price/gateway v1.0.0',
				},
				compress: false,
				large_threshold: 500,
				shard: this.shard,
			},
		});
	}

	// ***************************************
	// ***** EVENT HANDLERS ******************
	// ***************************************

	public onClose(code: number): void {
		console.error(this.shard, code);
	}

	public onMessage(message: any): void {
		if (message instanceof ArrayBuffer) message = new Uint8Array(message);
		const l = message.length;
		const flush =
			l >= 4 &&
			message[l - 4] === 0x00 &&
			message[l - 3] === 0x00 &&
			message[l - 2] === 0xff &&
			message[l - 1] === 0xff;
		this.inflate.push(message, flush && zlib.Z_SYNC_FLUSH);
		if (!flush) return;
		message = this.inflate.result;
		if (!message) return;

		const data = JSON.parse(message as string);
		if (data.s > (this.lastSeq ?? 0)) this.lastSeq = data.s;

		switch (data.op) {
			case OPCodes.DISPATCH:
				return this._onDispatch(data.t, data.d);
			case OPCodes.HEARTBEAT:
				return this.heartbeat(true);
			case OPCodes.RECONNECT: {
				this.shouldResume = true;
				console.log('Gateway requested reconnect at', Date.now());
				this.destroy({ code: CloseCodes.NORMAL_CLOSURE, reconnect: true });
				break;
			}
			case OPCodes.INVALID_SESSION: {
				this.shouldResume = data.d;
				if (!data.d) {
					this.sessionID = null;
					this.lastSeq = null;
				}
				console.log('Gateway invalidated session, resuming?', data.d);
				this.destroy({ code: CloseCodes.GOING_AWAY, reconnect: true });
				break;
			}
			case OPCodes.HELLO: {
				const interval = data.d.heartbeat_interval;
				this.heartbeatInterval = setInterval(() => this.heartbeat(), interval);
				this.identify();
				break;
			}
			case OPCodes.HEARTBEAT_ACK: {
				this.hasACKed = true;
				break;
			}
			default:
				console.log(data);
		}
	}

	private _onDispatch(event: string, data: any): any {
		if (event === 'READY') {
			this.sessionID = data.session_id;
			data.guilds.map(({ id }: { id: string }) => this.expectedGuilds.add(id));
			/* Redis caching here */
			return;
		} else if (event === 'GUILD_CREATE') {
			if (this.expectedGuilds.has(data.id)) {
				void this.redis.set(data.id, JSON.stringify(data));
				this.guilds.set(data.id, data);
				console.log('Received guild', data.id);
				this.expectedGuilds.delete(data.id);
				if (this.expectedGuilds.size) return;

				this.broker.publish('guilds', this.guilds.keys());
				this.guilds.clear();
				return;
			}
		}

		return this.broker.publish('dispatch', { event, data });
	}
}

export enum OPCodes {
	DISPATCH, // Receive
	HEARTBEAT, // Send & Receive
	IDENTIFY, // Send
	PRESENCE_UPDATE, // Send
	VOICE_STATE_UPDATE, // Send
	RESUME = 6, // Send
	RECONNECT, // Receive
	REQUEST_GUILD_MEMBERS, // Send
	INVALID_SESSION, // Receive
	HELLO, // Receive
	HEARTBEAT_ACK, // Receive
}

export enum CloseCodes {
	NORMAL_CLOSURE = 1000,
	GOING_AWAY,
	UNKNOWN_ERROR = 4000,
	UNKNOWN_OPCODE,
	DECODE_ERROR,
	NOT_AUTHENTICATED,
	AUTHENTICATION_FAILED,
	ALREADY_AUTHENTICATED,
	INVALID_SEQUENCE = 4007,
	RATE_LIMITED,
	SESSION_TIMED_OUT,
	INVALID_SHARD,
	SHARDING_REQUIRED,
	INVALID_API_VERSION,
	INVALID_INTENTS,
	DISALLOWED_INTENTS,
}
