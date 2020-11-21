import { APIRequest, APIRequestOptions } from './APIRequest';
import { buildRoute } from './APIRouter';
import { RequestHandler } from './RequestHandler';
import { Constants } from '@price/structures';
import { BaseClient } from '../client/BaseClient';
const { Endpoints } = Constants;

export class RESTManager {
	public readonly client: BaseClient;
	public readonly handlers = new Map<string, any>();
	public readonly tokenPrefix = 'Bot';
	public readonly versioned = true;
	public globalTimeout: Promise<void> | null = null;

	public constructor(client: BaseClient) {
		this.client = client;
	}

	public get api(): any {
		return buildRoute(this);
	}

	public getAuth(): string {
		const token = this.client.token;
		if (token) return `${this.tokenPrefix} ${token}`;
		throw Error('Invalid token');
	}

	public get cdn(): any {
		return Endpoints.CDN(this.client.options.http.cdn);
	}

	public push(handler: RequestHandler, apiRequest: APIRequest) {
		return new Promise((resolve, reject) => {
			handler
				.push({
					request: apiRequest,
					resolve,
					reject,
					retries: 0,
				})
				.catch(reject);
		});
	}

	public request(method: string, url: string, options: APIRequestOptions) {
		const apiRequest = new APIRequest(this, method, url, options);
		let handler = this.handlers.get(apiRequest.route);

		if (!handler) {
			handler = new RequestHandler(this);
			this.handlers.set(apiRequest.route, handler);
		}

		return this.push(handler, apiRequest);
	}

	public set endpoint(endpoint: string) {
		this.client.options.http.api = endpoint;
	}
}
