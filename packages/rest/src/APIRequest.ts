import { RESTManager } from './RESTManager';
import https from 'https';
import FormData from '@discordjs/form-data';
import AbortController from 'abort-controller';
import fetch, { Response } from 'node-fetch';

const agent = new https.Agent({ keepAlive: true });

export class APIRequest {
	public readonly manager: RESTManager;
	public readonly method: string;
	public readonly route: string;
	public readonly path: string;
	public readonly options: APIRequestOptions;

	public constructor(manager: RESTManager, method: string, path: string, options: APIRequestOptions) {
		this.manager = manager;
		this.method = method;
		this.route = options.route;
		this.options = options;

		let queryString = '';
		if (options.query) {
			const query = Object.entries(options.query).filter(([, value]) => value !== null && value !== undefined);
			queryString = new URLSearchParams(query).toString();
		}
		this.path = `${path}${queryString && `?${queryString}`}`;
	}

	public make(): Promise<Response> {
		const base =
			this.options.versioned === false
				? this.manager.http.api
				: `${this.manager.http.api}/v${this.manager.http.version}`;
		const url = new URL(this.path, base);

		let headers: any = { 'User-Agent': 'PriceREST' };
		if (this.options.auth !== false) headers.Authorization = this.manager.authorization;
		if (this.options.reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(this.options.reason);
		if (this.options.headers) headers = Object.assign(headers, this.options.headers);

		let body;
		if (this.options.files?.length) {
			body = new FormData();
			for (const file of this.options.files) if (file.file) body.append(file.name, file.file, file.name);
			if (typeof this.options.data !== 'undefined') body.append('payload_json', JSON.stringify(this.options.data));
			headers = Object.assign(headers, body.getHeaders());
		} else if (this.options.data !== null) {
			body = JSON.stringify(this.options.data);
			headers['Content-Type'] = 'application/json';
		}

		const controller = new AbortController();
		const timeout = this.manager.setTimeout(() => controller.abort(), this.manager.requestTimeout);
		return fetch(url, {
			method: this.method,
			headers,
			agent,
			body,
			signal: controller.signal,
		}).finally(() => this.manager.clearTimeout(timeout));
	}
}

export interface APIRequestOptions {
	auth?: boolean;
	data?: any;
	files?: {
		file: any;
		name: string;
	}[];
	headers?: Record<string, any>;
	query?: Record<string, any>;
	reason?: string;
	route: string;
	versioned?: boolean;
}
