import { User, TextChannel, Message } from 'discord.js';
import Monster from './monster';
import Player from './player';
import { getMaxHP, selectButton, sleep } from '../../util/utils';
import DialogGenerator from '../../util/dialog-generator';
import {
	MessageActionRow,
	MessageButton,
	MessageComponent,
} from 'discord-buttons';

interface BattleOptions {
	user: User;
	channel: TextChannel;
	monster: Monster;
}

class Battle {
	private _turn = 0;
	private ended = false;
	private readonly emojis = [
		'803358237969481788',
		'803358238040653895',
		'803358237977608242',
		'803358237956505610',
	];

	private constructor(
		public readonly player: Player,
		public readonly channel: TextChannel,
		public readonly monster: Monster,
		private readonly dialogGenerator: DialogGenerator
	) {}

	public static async init({ user, channel, monster }: BattleOptions) {
		const player = await Player.init(user);
		const dialogGenerator = await DialogGenerator.init();
		return new this(player, channel, monster, dialogGenerator);
	}

	public get turn() {
		return this._turn;
	}

	public async start() {
		this.player.user.inBattle = true;
		await this.monster.onSpawn(this);

		this.nextTurn();
	}

	private nextTurn() {
		this._turn++;
		this.showMainMenu();
	}

	private async showMainMenu(message?: Message): Promise<void> {
		const dialog = await this.monster.getFlavorText(this);
		const doc = await this.player.user.getDocument();

		const embed = this.dialogGenerator
			.embedDialog(dialog)
			.setTitle('Battle')
			.setDescription(
				[
					'**HP:**',
					`You: \`${doc.hp} / ${getMaxHP(doc.lv)}\``,
					`${this.monster.name}: \`${this.monster.hp} / ${this.monster.fullHP}\``,
				].join('\n')
			);

		const { image } = this.monster;
		if (image) this.monster.attachImage(embed);

		const options = ['FIGHT', 'ACT', 'ITEM', 'SPARE'];

		const actionRow = new MessageActionRow().addComponents(
			...options.map((opt, index) =>
				new MessageButton()
					.setStyle('gray')
					.setLabel(opt)
					.setEmoji(this.emojis[index])
					.setID(index.toString())
			)
		);

		// Send menu message
		if (!message) {
			message = await this.channel.send({ embed, components: [actionRow] });
		} else {
			await message.edit({ embed, components: [actionRow] });
		}

		const collected = await message.awaitButtons(
			(button: MessageComponent) =>
				button.clicker.user.id === this.player.user.id,
			{ max: 1, time: 1 * 60 * 60 * 1000 }
		);

		const response = collected.first();
		if (!response) return this.end('Time limit exceeded');

		// Choose action from reaction
		let next = true;
		const index = Number(response.id);

		if (index !== 0) response.reply.defer(true);

		switch (index) {
			case 0:
				const damage = await this.player.fight(this);
				await this.monster.onDamage(damage, this);

				const newButtons = selectButton(response.id, [actionRow]);
				await message.edit({ embed, components: newButtons });
				response.reply.defer(true);

				await this.channel.send(
					this.dialogGenerator.embedDialog(
						`You strike ${this.monster.name} and deal ${damage} damage.`
					)
				);
				next = true;
				break;
			case 1:
				next = await this.player.act(this, message);
				break;
			case 2:
				next = await this.player.item(this);
				break;
			case 3:
				next = await this.player.mercy(this, message);
		}

		if (this.ended) return;
		if (!next) return this.showMainMenu(message);

		// Monster dies
		if (this.monster.hp <= 0) {
			const gold = await this.monster.getGold(false, this);
			const exp = await this.monster.getEXP(this);

			await this.player.user.addGold(gold);

			const prevLv = doc.lv;
			const newLv = (await this.player.user.addExp(exp)).lv;

			await this.monster.onDeath(this);

			await this.end(['YOU WON!', `You earned ${gold} gold.`].join('\n'));

			if (newLv > prevLv) {
				await this.channel.send(
					this.dialogGenerator.embedDialog('Your LOVE increased.')
				);
			}

			return;
		}

		// Send attack dialog
		const attackDialog = await this.monster.getAttackQuote(this);
		if (attackDialog) {
			await this.channel.send(
				this.dialogGenerator.embedDialog(attackDialog, this.monster.image)
			);
			await sleep(1000);
		}

		// Attack player
		const attack = await this.monster.getAttack(false, this);
		if (attack > 0) {
			await this.player.damage(attack);

			await this.channel.send(
				this.dialogGenerator.embedDialog(
					`${this.monster.name.toUpperCase()} dealt ${attack} damage!`
				)
			);
		}

		this.nextTurn();
	}

	public async end(message: string) {
		this.ended = true;
		this.player.user.inBattle = false;

		await this.channel.send(this.dialogGenerator.embedDialog(message));
	}
}

export default Battle;
