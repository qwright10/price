import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { Inflate, Z_SYNC_FLUSH } from 'zlib-sync';
import { Utils } from '@price/utils';

/**
 * The wrapper for all WebSocket instances.
 * @extends {EventEmitter}
 */
export class SocketClient extends EventEmitter {
	private readonly _socket: WebSocket;
	private readonly _url: URL;
	private readonly encoding: 'etf' | 'json';
	private readonly inflate = new Inflate({ chunkSize: 65535 });

	public constructor(url: string, query: Record<string, string>) {
		super();

		this.encoding = query.encoding as 'etf' | 'json';
		this._url = Utils.encodeQuery(url, query);
		this._socket = new WebSocket(this._url);
		this._socket.onclose = this.emit.bind(this, SocketEvents.CLOSE);
		this._socket.onerror = this.emit.bind(this, SocketEvents.ERROR);
		this._socket.onmessage = this.onMessage.bind(this);
		this._socket.onopen = this.emit.bind(this, SocketEvents.OPEN);
	}

	public onMessage({ data }: { data: WebSocket.Data }) {
		const message =
			data instanceof ArrayBuffer
				? Buffer.from(data)
				: typeof data === 'string'
				? Buffer.from(data)
				: Array.isArray(data)
				? Buffer.concat(data)
				: data;

		const l = message.length;
		const flush =
			l >= 4 &&
			message[l - 4] === 0x00 &&
			message[l - 3] === 0x00 &&
			message[l - 2] === 0xff &&
			message[l - 1] === 0xff;
		this.inflate.push(message, flush && Z_SYNC_FLUSH);
		if (!flush) return;
		if (!this.inflate.result) return;

		this.emit(SocketEvents.MESSAGE, Utils.decode(this.inflate.result, this.encoding));
	}

	/**
	 * This wrapper's WebSocket instance
	 * @type {?WebSocket}
	 * @readonly
	 */
	public get socket(): WebSocket {
		return this._socket;
	}

	/**
	 * This wrapper's connection state
	 * @type {?string}
	 * @readonly
	 */
	public get status(): number {
		return this._socket.readyState;
	}

	/**
	 * The URL this socket is connected/connecting to
	 * @type {?string}
	 * @readonly
	 */
	public get url(): URL {
		return this._url;
	}

	/**
	 * Closes this wrapper's socket with a given code (or 1000)
	 * @param {number=1000} code - The close code
	 * @returns {void}
	 */
	public close(code = 1000): void {
		this._socket.close(code);
	}

	/**
	 * Sends an object or string through the socket.
	 * @param {object|string} data - The data to send
	 * @returns {void}
	 */
	public send(data: any): void {
		if (this._socket.readyState !== WebSocket.OPEN) throw Error('WebSocket not ready');
		return this._socket.send(Utils.encode(data, this.encoding));
	}
}

export const SocketEvents = {
	CLOSE: Symbol('CLOSE'),
	ERROR: Symbol('ERROR'),
	MESSAGE: Symbol('MESSAGE'),
	OPEN: Symbol('OPEN'),
};
