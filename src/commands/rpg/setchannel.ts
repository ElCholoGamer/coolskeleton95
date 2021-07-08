import Category from '../../structures/category';
import Command from '../../structures/command';
import CommandEvent from '../../structures/command/command-event';

class SetChannel extends Command {
	public constructor() {
		super('setchannel', 'SETS THE RPG CHANNEL ON THIS SERVER.', Category.RPG, {
			usage: '[#channel]',
			permissions: ['ADMINISTRATOR'],
			disabled: false,
		});
	}

	public async execute({ message, channel, guild }: CommandEvent) {
		const newChannel = message.mentions.channels.first() || channel;
		if (!newChannel) {
			return await channel.send('YOU NEED TO MENTION A SERVER CHANNEL!');
		}

		const doc = await guild.getDocument();
		doc.rpgChannel = newChannel.id;
		await doc.save();

		await channel.send(`RPG CHANNEL SET TO <#${doc.rpgChannel}>!`);
	}
}

export default SetChannel;
