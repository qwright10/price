import { DiscordAPIError } from './DiscordAPIError';
import { HTTPError } from './HTTPError';
import { Response } from 'node-fetch';
import { RESTManager } from './RESTManager';
import { Constants } from '@price/structures';
import { APIRequest } from './APIRequest';
const { RATELIMIT } = Constants.Events;

function parseResponse(res: Response): Promise<Buffer | Record<string, any>> {
	if (res.headers.get('content-type')?.startsWith('application/json')) return res.json();
	return res.buffer();
}

function getAPIOffset(serverDate: Date | number | string): number {
	return new Date(serverDate).getTime() - Date.now();
}

function calculateReset(reset: number, serverDate: Date | number | string): number {
	return new Date(Number(reset) * 1000).getTime() - getAPIOffset(serverDate);
}

export class RequestHandler {
	public readonly manager: RESTManager;
	public busy = false;
	private readonly queue: WrappedRequest[] = [];
	private reset = -1;
	private remaining = -1;
	private limit = -1;
	private retryAfter = -1;

	public constructor(manager: RESTManager) {
		this.manager = manager;
	}

	public push(request: WrappedRequest) {
		if (this.busy) {
			this.queue.push(request);
			return this.run();
		}

		return this.execute(request);
	}

	public run() {
		if (this.queue.length === 0) return Promise.resolve();
		return this.execute(this.queue.shift()!);
	}

	public get limited(): boolean {
		return Boolean(this.manager.globalTimeout) || (this.remaining <= 0 && Date.now() < this.reset);
	}

	public get _inactive(): boolean {
		return this.queue.length === 0 && !this.limited && !this.busy;
	}

	public async execute(item: WrappedRequest): Promise<any> {
		if (this.busy) {
			this.queue.unshift(item);
			return null;
		}

		this.busy = true;
		const { reject, request, resolve } = item;

		if (this.limited) {
			const timeout = this.reset + this.manager.client.options.restTimeOffset - Date.now();

			if (this.manager.client.listenerCount(RATELIMIT)) {
				this.manager.client.emit(RATELIMIT, {
					timeout,
					limit: this.limit,
					method: request.method,
					path: request.path,
					route: request.route,
				});
			}

			if (this.manager.globalTimeout) {
				await this.manager.globalTimeout;
			} else {
				await new Promise((r) => setTimeout(r, timeout));
			}
		}

		let res;
		try {
			res = await request.make();
		} catch (error) {
			this.busy = false;
			return reject(new HTTPError(error.message, error.constructor.name, error.status, request.method, request.path));
		}

		const serverDate = res.headers.get('date');
		const limit = res.headers.get('x-ratelimit-limit');
		const remaining = res.headers.get('x-ratelimit-remaining');
		const reset = res.headers.get('x-ratelimit-reset');
		const retryAfter = res.headers.get('retry-after');

		this.limit = limit ? Number(limit) : Infinity;
		this.remaining = remaining ? Number(remaining) : 1;
		this.reset = reset ? calculateReset(Number(reset), serverDate!) : Date.now();
		this.retryAfter = retryAfter ? Number(retryAfter) : -1;

		if (res.headers.get('x-ratelimit-global')) {
			this.manager.globalTimeout = new Promise((r) => setTimeout(r, this.retryAfter));
			await this.manager.globalTimeout;
			this.manager.globalTimeout = null;
		}

		this.busy = false;

		if (res.ok) {
			const success = await parseResponse(res);
			resolve(success);
			return this.run();
		} else if (res.status === 429) {
			this.queue.unshift(item);
			await new Promise((r) => setTimeout(r, this.retryAfter));
			return this.run();
		} else if (res.status >= 500 && res.status < 600) {
			if (item.retries === this.manager.client.options.retryLimit) {
				return reject(
					new HTTPError(res.statusText, res.constructor.name, res.status, item.request.method, request.path),
				);
			}

			item.retries++;
			this.queue.unshift(item);
			return this.run();
		}
		try {
			const data = await parseResponse(res);
			if (res.status >= 400 && res.status < 500) {
				return reject(new DiscordAPIError(request.path, data, request.method, res.status));
			}
			return null;
		} catch (err) {
			return reject(new HTTPError(err.message, err.constructor.name, err.status, request.method, request.path));
		}
	}
}

interface WrappedRequest {
	request: APIRequest;
	resolve: any;
	reject: any;
	retries: number;
}
