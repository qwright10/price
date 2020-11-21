import { Message, RawMessage } from '@price/structures';
import { BaseClient } from '../../BaseClient';

export default function MessageCreate(data: RawMessage, client: BaseClient) {
	const message = new Message(client, data);
	client.emit('message', message);
}
