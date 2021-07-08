import { User, MessageEmbed, Message } from 'discord.js';
import { IUser } from '../../models/user';
import Battle from './battle';
import { embedColor } from '../../config.json';
import { getMaxHP, selectButton, sleep } from '../../util/utils';
import DialogGenerator from '../../util/dialog-generator';
import {
	MessageActionRow,
	MessageButton,
	MessageComponent,
} from 'discord-buttons';

class Player {
	public constructor(
		public readonly user: User,
		private readonly doc: IUser,
		private readonly dialogGenerator: DialogGenerator
	) {}

	public static async init(user: User) {
		const doc = await user.getDocument();
		const dialogGenerator = await DialogGenerator.init();
		return new this(user, doc, dialogGenerator);
	}

	public async fight(battle: Battle): Promise<number> {
		const damage = Math.randomInt(3, 6);
		battle.monster.hp -= damage;

		return damage;
	}

	public async act(battle: Battle, message: Message): Promise<boolean> {
		const { monster, channel } = battle;

		const at = await monster.getAttack(true, battle);
		const def = await monster.getDefense(true, battle);

		const options = await monster.getActOptions(battle);
		options.unshift({
			name: 'Check',
			execute: () =>
				[
					`${monster.name.toUpperCase()} - AT ${at} DEF ${def}`,
					monster.description,
				].join('\n'),
		});

		const components = [];
		const chunkSize = 4;
		const chunks = options.chunk(chunkSize);

		for (let chunk = 0; chunk < chunks.length; chunk++) {
			const actionRow = new MessageActionRow();

			for (let i = 0; i < chunks[chunk].length; i++) {
				const index = chunk * chunkSize + i;

				actionRow.addComponent(
					new MessageButton()
						.setStyle('gray')
						.setLabel(options[i].name)
						.setID(index.toString())
				);
			}

			components.push(actionRow);
		}

		components.push(
			new MessageActionRow().addComponent(
				new MessageButton().setStyle('gray').setLabel('Back').setID('back')
			)
		);

		const embed = new MessageEmbed().setColor(embedColor).setTitle('ACT Menu');
		monster.attachImage(embed);

		await message.edit({ embed, components: [...components] });

		const collected = await message.awaitButtons(
			(button: MessageComponent) => button.clicker.user.id === this.user.id,
			{ max: 1, time: 1 * 60 * 60 * 1000 }
		);

		const response = collected.first();
		if (!response) return false;

		if (response.id === 'back') {
			response.reply.defer(true);
			return false;
		}

		const newButtons = selectButton(response.id, components);
		await message.edit({ embed, components: newButtons });
		response.reply.defer(true);

		const index = Number(response.id);
		const actResponse = await options[index].execute.call(monster, battle);

		if (actResponse) {
			await channel.send(this.dialogGenerator.embedDialog(actResponse));
			await sleep(2000);
		}

		return true;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async item(battle: Battle): Promise<boolean> {
		// TODO
		return false;
	}

	public async mercy(battle: Battle, message: Message): Promise<boolean> {
		const { monster } = battle;

		const embed = new MessageEmbed().setColor(embedColor).setTitle('MERCY');
		monster.attachImage(embed);

		const buttons = new MessageActionRow()
			.addComponent(
				new MessageButton()
					.setStyle('gray')
					.setLabel('Spare')
					.setID('spare')
					.setDisabled(!monster.spareable)
			)
			.addComponent(
				new MessageButton()
					.setStyle('gray')
					.setLabel('Flee')
					.setID('flee')
					.setDisabled(!monster.fleeable)
			);

		const backButton = new MessageActionRow().addComponent(
			new MessageButton().setStyle('gray').setLabel('Back').setID('back')
		);

		const components = [buttons, backButton];
		await message.edit({ embed, components });

		const collected = await message.awaitButtons(
			(button: MessageComponent) => button.clicker.user.id === this.user.id,
			{ max: 1, time: 1 * 60 * 60 * 1000 }
		);

		const response = collected.first();
		if (!response) return false;

		if (response.id === 'back') {
			response.reply.defer(true);
			return false;
		}

		const newButtons = selectButton(response.id, components);
		await message.edit({ embed, components: newButtons });
		response.reply.defer(true);

		switch (response.id) {
			case 'spare':
				const gold = await battle.monster.getGold(true, battle);
				await this.user.addGold(gold);
				await battle.monster.onSpare(battle);

				await battle.end(['YOU WON!', `You earned ${gold} gold.`].join('\n'));
				break;
			case 'flee':
				// Flee
				await battle.end(
					[
						"I'm outta here.",
						"Don't slow me down.",
						"I've got better to do.",
					].random()
				);
				return true;
		}

		return true;
	}

	public async heal(amount: number, save = true) {
		this.doc.hp = Math.clamp(this.doc.hp + amount, 0, getMaxHP(this.doc.lv));
		if (save) await this.doc.save();
	}

	public damage(amount: number, save = true) {
		return this.heal(-amount, save);
	}
}

export default Player;
