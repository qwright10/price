import chalk from 'chalk';
import util from 'util';

export const Logger = new Proxy<any>(
	{},
	{
		get: (_, label: string) => (strings: string[], ...exprs: any[]) => {
			if (!Array.isArray(strings))
				return process.stdout.write(chalk.redBright(`.write may only be invoked by a tagged template`));
			if (label) label = chalk.bold(chalk.blueBright(chalk.underline(`[${label}]`).concat(':'))).concat(' ');

			const highlightTypes = (exprs: any[]) =>
				exprs.map((expr) => {
					let value = '';
					if (typeof expr === 'number') value = chalk.yellow(expr.toString());
					else if (typeof expr === 'boolean') value = (expr ? chalk.greenBright : chalk.redBright)(String(expr));
					else if (expr instanceof Date) value = chalk.green(expr.toLocaleString());
					else if (typeof expr === 'object') value = util.inspect(expr, { depth: 2 });
					else if (typeof expr === 'bigint') value = chalk.yellow(expr.toString()) + chalk.blue('n');
					else if (typeof expr === 'string') value = chalk.yellow(expr);
					else value = String(expr);
					return value;
				});

			let str;
			if (strings.length > 1) {
				str = highlightTypes(exprs)
					.map((v, i) => strings[i].concat(v))
					.join('')
					.concat(strings[strings.length - 1]);
			} else str = strings[0];

			process.stdout.write(`${label}${str}\n`);
		},
	},
);
