import { Client } from 'discord.js';
import disbut from 'discord-buttons';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import startup from './util/startup';
import db from './util/db';
import Shop from './rpg/shop';
import { isModule, readFullDir } from './util/utils';

const NODE_ENV = (process.env.NODE_ENV ||= process.argv.includes('-d')
	? 'development'
	: 'production');

(async () => {
	if (NODE_ENV === 'development') (await import('dotenv')).config();

	if (existsSync('ascii.txt')) {
		const ascii = (await readFile('ascii.txt')).toString();
		console.log(ascii);
	}
})().then(async function start() {
	try {
		// Extensions
		const extensionFiles = (
			await readFullDir(join(__dirname, 'extensions'))
		).filter(isModule);

		await Promise.all(extensionFiles.map(file => import(file)));

		console.log(`Running in ${NODE_ENV} mode`);

		await db();
		console.log('MongoDB connected!');

		const client = new Client({ restTimeOffset: 300 });
		disbut(client);

		client.shop = await Shop.init();
		await startup(client);

		console.log('Logging in...');
		client.login(process.env.TOKEN);
	} catch (err) {
		console.error('Startup error:', err);
		setTimeout(start, 2000);
	}
});
