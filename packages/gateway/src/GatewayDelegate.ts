import { EventEmitter } from 'events';
import { SocketClient, SocketEvents } from './SocketClient';
import { Amqp } from '@spectacles/brokers';
import { RedisClient } from '@price/cache';
import { Logger, Utils } from '@price/utils';
import { isDeepStrictEqual } from 'util';
import { EventTrap } from './EventTrap';
import crypto from 'crypto';

export const filename = __filename;

export interface GatewayDelegateOptions {
	amqp: {
		conn: string;
		group: string;
	};
	gateway: {
		intents: number;
		shard: [number, number];
		token: string;
		url: URL;
	};
}

export class GatewayDelegate extends EventEmitter {
	public readonly broker: Amqp;
	private brokerReady = false;
	private readonly redis = new RedisClient();
	private readonly publisherID = crypto.randomBytes(120).toString('base64');
	private readonly traps = new Map<string, EventTrap>();
	private readonly options: GatewayDelegateOptions;

	private hasACKed = true;
	private heartbeatInterval?: NodeJS.Timeout;
	private readonly intents: number;
	private readonly shard: [number, number];
	private readonly token: string;

	private lastSeq: number | null = null;
	private closeSeq: number | null = null;
	private sessionID: string | null = null;
	private readonly expectedGuilds = new Set<string>();
	private readonly guilds = new Map<string, any>();

	private shouldResume = false;
	private gatewayURL?: string;
	private socket: SocketClient | null = null;

	public constructor(options: GatewayDelegateOptions) {
		super();

		this.options = options;
		this.broker = new Amqp(options.amqp.group);
		this.intents = options.gateway.intents;
		this.token = options.gateway.token;
		this.shard = options.gateway.shard;
	}

	public publishTrapMessage(key: string, message: string) {
		this.redis.client.publish(this.publisherID, `${key}:${message}`);
	}

	public registerTrap(conditions: [string, Record<string, any>], duration: number) {
		const trap = new EventTrap(this, conditions, duration, Utils.generateKey());
		trap.on('end', () => this.traps.delete(trap.key));
		this.traps.set(trap.key, trap);
	}

	public onUpstreamMessage(event: string, { ack, reply }: { ack(): void; reply(...args: any[]): void }): void {
		let data;
		try {
			data = JSON.parse(event);
		} catch (e) {
			reply({ data: null, error: e });
			return;
		}

		console.log(data);

		switch (data.type) {
			case 'dispatch': {
				// const payload = data.data;
				// this.socket.send(payload);
				if (data.trap) {
					this.registerTrap(data.trap.conditions, data.trap.duration);
					reply({ key: this.publisherID });
					return ack();
				}

				return ack();
			}
		}
	}

	public async connect(): Promise<this> {
		if (!this.brokerReady) {
			await this.broker.connect(this.options.amqp.conn);
			await this.broker.createQueue('gateway_downstream');
			await this.broker.createQueue('gateway_upstream');
			await this.broker.subscribe('gateway_upstream');
			this.broker.on('gateway_upstream', this.onUpstreamMessage.bind(this));
			this.brokerReady = true;
		}

		this.gatewayURL = this.gatewayURL ?? (await Utils.fetchGateway(this.token)).url;
		this.socket = new SocketClient(this.gatewayURL, { v: '8', encoding: 'etf', compress: 'zlib-stream' });
		this.socket.on(SocketEvents.ERROR, console.error);
		this.socket.on(SocketEvents.CLOSE, this.onClose.bind(this));
		this.socket.on(SocketEvents.MESSAGE, this.onMessage.bind(this));
		Logger.SOCKET`Connection established at: ${Date.now()}`;
		return this;
	}

	public destroy(code = CloseCodes.NORMAL_CLOSURE, reconnect = true): void {
		Logger.SOCKET`Destroyed with code: ${CloseCodes[code]}`;
		this.closeSeq = this.lastSeq;
		this.lastSeq = null;
		if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

		if (this.socket) this.socket.close(code);
		if (reconnect) {
			Logger.SOCKET`Reconnecting in 5 seconds'`;
			setTimeout(() => void this.connect(), 5000);
			return;
		}

		Logger.SOCKET`Not reconnecting`;
		return process.exit(1);
	}

	public heartbeat(force = false): void {
		if (!this.hasACKed && !force) {
			this.shouldResume = true;
			return this.destroy(CloseCodes.SESSION_TIMED_OUT, true);
		}

		return this.socket!.send({
			op: OPCodes.HEARTBEAT,
			d: this.lastSeq,
		});
	}

	public identify(): void {
		if (this.shouldResume && this.sessionID) {
			Logger.GATEWAY`Session ID found ${this.sessionID}, resuming at ${Date.now()}`;
			this.shouldResume = false;
			return this.socket!.send({
				op: OPCodes.RESUME,
				d: {
					token: this.token,
					session_id: this.sessionID,
					seq: this.closeSeq ?? this.lastSeq,
					intents: this.intents,
				},
			});
		}

		Logger.IDENTIFY`Identifying new session with intents ${this.intents}`;
		return this.socket!.send({
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
				intents: this.intents,
			},
		});
	}

	// ***************************************
	// ***** EVENT HANDLERS ******************
	// ***************************************

	public onClose(event: CloseEvent): void {
		return Logger.SOCKET`Shard socket ${this.shard} closed: ${event.code} ${event.reason || 'no reason'}`;

		switch (event.code) {
			case 1001:
				this.destroy();
			case 1006:
				this.destroy();
			default:
		}
	}

	public onMessage(data: Payload): void {
		if ((data.s ?? 0) > (this.lastSeq ?? 0)) this.lastSeq = data.s;

		switch (data.op) {
			case OPCodes.DISPATCH:
				return this._onDispatch(data.t!, data.d);
			case OPCodes.HEARTBEAT:
				return this.heartbeat(true);
			case OPCodes.RECONNECT:
				Logger.GATEWAY`Gateway requested reconnect at ${Date.now()}`;
				this.shouldResume = true;
				this.destroy(CloseCodes.NORMAL_CLOSURE, true);
				return;
			case OPCodes.INVALID_SESSION:
				Logger.GATEWAY`Gateway invalidated session, resuming? ${data.d ? 'yes' : 'no'}`;

				if (!data.d) {
					this.sessionID = null;
					this.lastSeq = null;
				}

				this.shouldResume = data.d;
				this.identify();
				return;
			case OPCodes.HELLO:
				this.heartbeatInterval = setInterval(() => this.heartbeat(), data.d.heartbeat_interval);
				this.identify();
				return;
			case OPCodes.HEARTBEAT_ACK:
				this.hasACKed = true;
			default:
				return undefined;
		}
	}

	private _onDispatch(event: string, data: any): any {
		if (event === 'READY') {
			this.sessionID = data.session_id;
			data.guilds.map(({ id }: { id: string }) => this.expectedGuilds.add(id));
			this.sessionID = data.session_id;

			const shardSame = isDeepStrictEqual(this.shard, data.shard);
			Logger.GATEWAY`Received shard: [${data.shard}] ${shardSame ? 'matching!' : 'not matching'}`;
			Logger.GATEWAY`Connected to gateway version: ${data.v}`;
			Logger.GATEWAY`Received session id: ${data.session_id}`;
			Logger.GATEWAY`Received ${data.guilds.length} guilds`;
			Logger.GATEWAY`Logged in as ${data.user.username}`;
			return;
		} else if (event === 'GUILD_CREATE') {
			if (this.expectedGuilds.has(data.id)) {
				void this.redis.set(data.id, JSON.stringify(data));
				this.guilds.set(data.id, data);
				this.expectedGuilds.delete(data.id);
				if (this.expectedGuilds.size) return;

				this.broker.publish('guilds', this.guilds.keys());
				this.guilds.clear();
				return;
			}
		}

		return this.broker.publish('gateway_downstream', { event, data });
	}
}

if (process.env.START_WORKER) {
	if (!process.env.GATEWAY_OPTIONS) {
		console.error('Missing gateway options!');
		process.exit(1);
	}

	const options = JSON.parse(process.env.GATEWAY_OPTIONS);
	const gateway = new GatewayDelegate(options);
	void gateway.connect();
}

interface Payload {
	op: OPCodes;
	s: number | null;
	t: string | null;
	d: any;
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
