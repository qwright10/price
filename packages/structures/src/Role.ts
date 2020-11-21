import { Base } from './Base';
import { Guild } from './Guild';
import { Permissions, PermissionsFlags } from './bitfields/Permissions';

export class Role<Client> extends Base<Client> {
	public color!: number;
	public deleted = false;
	public guild: Guild<Client>;
	public hoist!: boolean;
	public managed!: boolean;
	public mentionable!: boolean;
	public name!: string;
	public permissions = new Permissions();
	public position!: number;

	public constructor(client: Client, guild: Guild<Client>, data: RawRole) {
		super(client);

		this.id = BigInt(data.id);
		this.guild = guild;
		this._patch(data);
	}

	public _patch(data: any) {
		if ('name' in data) this.name = data.name;
		if ('color' in data) this.color = data.color;
		if ('hoist' in data) this.hoist = data.hoist;
		if ('position' in data) this.position = data.position;
		if ('permissions_new' in data) this.permissions = new Permissions(data.permissions_new);
		if ('managed' in data) this.managed = data.managed;
		if ('mentionable' in data) this.mentionable = data.mentionable;
	}

	public delete(): Promise<this> {
		return (this.client as any).api
			.guilds(this.guild.id)
			.roles(this.id)
			.delete()
			.then(() => {
				this.deleted = true;
				return this;
			});
	}

	public static comparePositions(role1: Role<any>, role2: Role<any>): number {
		if (role1.position === role2.position) return Number(role2.id - role1.id);
		return role1.position - role2.position;
	}

	private edit(data: RoleEditData): Promise<this> {
		if (Object.keys(data).length === 0) return Promise.resolve(this);
		if (data.permissions instanceof Permissions) data.permissions = data.permissions.valueOf();
		return (this.client as any).api
			.guilds(this.guild.id)
			.roles(this.id)
			.patch({ data })
			.then((r: RawRole) => {
				this._patch(r);
				return this;
			});
	}
}

export interface RoleEditData {
	name?: string;
	permissions?: Permissions | PermissionsFlags;
	color?: number;
	hoist?: boolean;
	mentionable?: boolean;
}

export interface RawRole {
	id: string;
	name: string;
	color: number;
	hoist: boolean;
	position: number;
	permissions: number;
	permissions_new: string;
	managed: boolean;
	mentionable: boolean;
}
