import { registerFont } from 'canvas';
import { Client } from 'discord.js';
import { basename, join } from 'path';
import CommandHandler from '../structures/command/command-handler';
import { BaseHandler } from '../structures/event-handler';
import { isModule, readFullDir, removeExtension } from './utils';

async function startup(client: Client) {
	// Events
	const eventFiles = (await readFullDir(join(__dirname, '../events'))).filter(
		isModule
	);

	await Promise.all(
		eventFiles.map(async file => {
			const { default: Handler } = await import(file);
			if (typeof Handler !== 'function') return;

			const handler: BaseHandler<any> = new Handler(client);
			client.on(handler.eventName, handler.execute.bind(handler));
		})
	);

	// Commands
	client.commandHandler = new CommandHandler(client);
	client.commandHandler.init();

	// Fonts
	const fontFiles = await readFullDir('./assets/font');
	for (const file of fontFiles) {
		const family = removeExtension(basename(file));
		registerFont(file, { family });
	}
}

export default startup;
