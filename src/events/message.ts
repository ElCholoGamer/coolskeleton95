import {
	Client,
	Message,
	TextChannel,
	MessageEmbed,
	MessageAttachment,
} from 'discord.js';
import { join } from 'path';
import EventHandler from '../structures/event-handler';
import { prefix, embedColor, battleChance } from '../config.json';
import { readFullDir } from '../util/utils';
import Monster from '../structures/rpg/monster';
import Battle from '../structures/rpg/battle';

class MessageHandler extends EventHandler('message') {
	private readonly monsters: (new () => Monster)[] = [];
	private readonly FIGHT_MESSAGE = 'fight';

	public constructor(client: Client) {
		super(client);
		this.loadMonsters();
	}

	private async loadMonsters() {
		const monsterFiles = await readFullDir(join(__dirname, '../rpg/monsters'));
		await Promise.all(
			monsterFiles.map(async file => {
				const MonsterConstructor = (await import(file)).default;
				if (typeof MonsterConstructor !== 'function') return;

				this.monsters.push(MonsterConstructor);
			})
		);
	}

	public async execute({ author, content, guild, client }: Message) {
		if (
			author.bot ||
			author.inBattle ||
			content.toLowerCase().startsWith(prefix.toLowerCase()) ||
			!guild ||
			Math.random() > battleChance
		)
			return;

		const { rpgChannel } = await guild.getDocument();
		if (!rpgChannel) return;

		const channel = await client.channels.fetch(rpgChannel);
		if (!(channel instanceof TextChannel) || channel.awaitingBattle) return;

		const MonsterConstructor = this.monsters.random();
		const monster = new MonsterConstructor();

		const embed = new MessageEmbed()
			.setColor(embedColor)
			.setDescription(`A wild **${monster.name}** draws near!`)
			.setFooter('Type "fight" to start the battle!');

		const { image } = monster;
		if (image) {
			const attachment = new MessageAttachment(
				`./assets/img/monsters/${image}`,
				image
			);
			embed.attachFiles([attachment]).setImage(`attachment://${image}`);
		}

		const spawnMessage = await channel.send(embed);
		channel.awaitingBattle = true;

		const collected = await channel.awaitMessages(
			(m: Message) =>
				m.content.toLowerCase() === this.FIGHT_MESSAGE &&
				!m.author.bot &&
				!m.author.inBattle,
			{ max: 1, time: 6e4 }
		);

		const first = collected.first();
		await spawnMessage.delete();

		channel.awaitingBattle = false;

		if (!first) return;

		const user = first.author;
		const battle = await Battle.init({ user, channel, monster });
		await battle.start();
	}
}

export default MessageHandler;
