export class HTTPError extends Error {
	public readonly name: string;
	public readonly code: number;
	public readonly method: string;
	public readonly path: string;

	public constructor(message: string, name: string, code: number, method: string, path: string) {
		super(message);

		this.name = name;
		this.code = code;
		this.method = method;
		this.path = path;
	}
}
