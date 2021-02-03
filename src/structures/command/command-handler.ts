import { DMChannel, Client, Collection, Message } from 'discord.js';
import { join } from 'path';
import { formatPermissions, isModule, readFullDir } from '../../util/utils';
import Command from '.';
import { prefix, owner } from '../../config.json';
import Category from '../category';
import CommandEvent from './command-event';

class CommandHandler {
	public readonly commands = new Collection<string, Command>();

	public constructor(public readonly client: Client) {
		client.on('message', m => this.handle(m));
	}

	public async init(): Promise<Collection<string, Command>> {
		const folder = join(__dirname, '../../commands');
		const files = (await readFullDir(folder)).filter(isModule);

		// Import and register all commands
		await Promise.all(
			files.map(async file => {
				const CommandConstructor = (await import(file)).default;
				if (typeof CommandConstructor !== 'function') return;

				const command = new CommandConstructor();
				if (command instanceof Command)
					this.commands.set(command.name, command);
			})
		);

		return this.commands;
	}

	public findCommand(search = ''): Command | undefined {
		search = search?.toLowerCase();
		if (this.commands.has(search)) return this.commands.get(search);

		return this.commands.find(
			cmd =>
				!!cmd.options.aliases?.some(alias => alias.toLowerCase() === search)
		);
	}

	public async handle(message: Message): Promise<boolean> {
		const { author, guild, member, channel, content } = message;

		// Initial checks
		if (
			author.bot ||
			!guild?.me ||
			!member ||
			channel instanceof DMChannel ||
			!content.toLowerCase().startsWith(prefix.toLowerCase())
		)
			return false;

		const [commandName, ...args] = content
			.slice(prefix.length)
			.trim()
			.split(/\s+/);

		// Find command
		const command = this.client.commandHandler.findCommand(commandName);
		if (!command) return false;

		const {
			category,
			options: { disabled, permissions = [], selfPermissions = [] },
		} = command;

		if (category === Category.OWNER && author.id !== owner) return false;

		if (disabled && author.id !== owner) {
			channel.send('THIS COMMAND IS DISABLED TEMPORARILY!');
			return false;
		}

		// Check that author has permissions
		if (!member.permissions.has(permissions)) {
			channel.send(
				`YOU NEED SOME PERMISSIONS FOR THIS COMMAND: ${formatPermissions(
					permissions
				)}`
			);
			return false;
		}

		// Check that bot has permissions
		if (!channel.permissionsFor(guild.me)?.has(selfPermissions)) {
			channel.send(
				`I NEED SOME PERMISSIONS FOR THIS COMMAND: ${formatPermissions(
					selfPermissions
				)}`
			);
			return false;
		}

		const event = new CommandEvent(message, args);
		try {
			await command.execute(event);
			return true;
		} catch (err) {
			console.error(err);
			return false;
		}
	}
}

export default CommandHandler;
