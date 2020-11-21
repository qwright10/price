import { BaseClient } from './client/BaseClient';
import { Message, RichEmbed } from '@price/structures';
import util from 'util';

const client = new (class extends BaseClient {})({
	owner: 329651188641431574n,
	// token: 'NzI3MTcyNDAwMzE1MjM2NDQz.Xvn-Eg.bBGC8a_E29rE9MBlZZDjcg29E5c', // backbone
	token: 'NTg2OTk1NTc1Njg2MTY4NTk1.XPwIOw.H8l3mGoIvffObmHPSohtinXoFQo', // shrimp
	// token: 'NzM5OTg5Nzc0NDkxODQ0NjE4.XyifLg.zBJXO5rH8ZJngFXCv_GRtYRz_lM', // price
	http: {
		api: 'https://discord.com/api',
		cdn: 'https://cdn.discordapp.com/',
		invite: 'https://discord.gg/',
		version: 6,
	},
	restRequestTimeout: 10000,
	restTimeOffset: 0,
	retryLimit: 3,
});

client.on('message', (message: Message<BaseClient>) => {
	return;
	void (async () => {
		if (message.author.bot) return;
		const cleaned = message.content.trimStart();
		const reg = /^; *(\w+)(( *.)*)$/;

		if (cleaned.startsWith(';')) {
			switch ((reg.exec(cleaned) ?? [])[1]) {
				case 'exec': {
					if (message.author.id !== '329651188641431574') return;
					const hrtime = process.hrtime();
					void message.reply(hrtime.join(' '));
				}
				case 'eval': {
					if (message.author.id !== '329651188641431574') return;

					let hrDiff = process.hrtime();
					let result;
					try {
						// eslint-disable-next-line no-eval
						result = await eval((reg.exec(message.content.trim()) ?? [])[2]);
						hrDiff = process.hrtime(hrDiff);
					} catch (e) {
						void message.reply(`An error occurred: \`${e}\``);
					}

					const res = _process(result, hrDiff, (reg.exec(message.content.trim()) ?? [])[2]);
					void message.reply(null, res);

					break;
				}
				case 'date': {
					void message.reply(`The current date is ${new Date().toLocaleString()}`);
					break;
				}
				case 'linkthis': {
					void message.reply(message.url);
					break;
				}
				case 'test': {
					void message.reply((reg.exec(message.content) ?? [])[1]);
					break;
				}
				default: {
					void message.reply('Unknown command');
					break;
				}
			}
		}
	})();
});

function _process(result: any, hrDiff: [number, number], code: string): RichEmbed {
	const inspected = util.inspect(result, { depth: 1 }).substring(0, 1000);

	return new RichEmbed()
		.setTitle(`Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`)
		.addField('Input', `\`\`\`js\n${code}\`\`\``)
		.addField('Result', `\`\`\`js\n${inspected}\`\`\``)
		.setTimestamp();
}

void client.connect();
