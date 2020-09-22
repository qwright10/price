import { GatewayDelegate } from './GatewayDelegate';
import { workerData } from 'worker_threads';

const s = new GatewayDelegate(workerData.DISCORD_TOKEN!);
void s.connect();
