/* eslint-disable */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'packages');
fs.readdirSync(p).map(pt => {
	exec(`cd ${path.join(p, pt)}; tsc -p . -w`)
		.on('exit', (code) => console.log(`${pt} exited with ${code}`))
		.stdout.on('data', (d) => console.log(`[${pt}]: ${d.replace(/\n/g, '')}`));
	console.log('Started for', pt);
});
