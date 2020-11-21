export class Snowflake {
	protected bin: bigint;

	public static readonly EPOCH = 1420070400000n;

	public constructor(snowflake: bigint | string = 0n) {
		this.bin = BigInt(snowflake);
	}

	public get timestamp(): Date {
		return new Date(Number((this.bin >> 22n) + Snowflake.EPOCH));
	}

	public get workerID(): number {
		return Number((this.bin & 0x3e0000n) >> 17n);
	}

	public get processID(): number {
		return Number((this.bin & 0x1f000n) >> 12n);
	}

	public get increment(): number {
		return Number(this.bin & 0xfffn);
	}

	public toString(): string {
		return this.bin.toString();
	}

	public valueOf(): bigint {
		return this.bin;
	}
}
