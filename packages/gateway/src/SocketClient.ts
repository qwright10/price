import WebSocket from 'ws';
import { EventEmitter } from 'events';

/**
 * The wrapper for all WebSocket instances.
 * @extends {EventEmitter}
 */
export class SocketClient extends EventEmitter {
	private _socket: WebSocket | null = null;
	private _url: string | null = null;

	public constructor(url?: string) {
		super();
		this._url = url ?? null;
	}

	/**
	 * Creates a WebSocket instance and connects.
	 * @param {?string} url The WS URL to connect to
	 */
	public connect(url: string | null = this._url) {
		if (!url) throw Error('No WebSocket connection URL was provided');
		if (this._socket) {
			this._socket.removeAllListeners();
			this._socket.close();
		}

		this._url = url;
		this._socket = new WebSocket(url)
			.on('close', (code, reason) => this.emit(SocketEvents.CLOSE, code, reason))
			.on('error', (err) => this.emit(SocketEvents.ERROR, err))
			.on('open', () => this.emit(SocketEvents.OPEN))
			.on('message', (data) => this.emit(SocketEvents.MESSAGE, data));
	}

	/**
	 * This wrapper's WebSocket instance
	 * @type {?WebSocket}
	 * @readonly
	 */
	public get socket(): WebSocket | null {
		return this._socket;
	}

	/**
	 * This wrapper's connection state
	 * @type {?string}
	 * @readonly
	 */
	public get status(): number {
		return this._socket?.readyState ?? WebSocket.CLOSED;
	}

	/**
	 * The URL this socket is connected/connecting to
	 * @type {?string}
	 * @readonly
	 */
	public get url(): string | null {
		return this._url;
	}

	/**
	 * Closes this wrapper's socket with a given code (or 1000)
	 * @param {number=1000} code - The close code
	 * @returns {void}
	 */
	public close(code = 1000): void {
		this._socket?.close(code);
		this._socket = null;
	}

	/**
	 * Sends an object or string through the socket.
	 * @param {object|string} data - The data to send
	 * @returns {void}
	 */
	public send(data: any): void {
		if (!this._socket || this._socket.readyState !== WebSocket.OPEN) throw Error('WebSocket not ready');
		if (typeof data === 'object') data = JSON.stringify(data);
		return this._socket.send(data);
	}
}

export const SocketEvents = {
	CLOSE: Symbol('CLOSE'),
	ERROR: Symbol('ERROR'),
	MESSAGE: Symbol('MESSAGE'),
	OPEN: Symbol('OPEN'),
};
