export class Base<Client> {
	public readonly client: Client;
	public id!: bigint;

	public constructor(client: Client) {
		this.client = client;
	}

	public _clone(): this {
		return Object.assign(Object.create(this), this);
	}

	public _patch(data: any): any {
		return data;
	}

	public _update(data: any): this {
		const clone = this._clone();
		clone._patch(data);
		return clone;
	}

	public valueOf(): bigint {
		return this.id;
	}
}
