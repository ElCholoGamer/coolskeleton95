/* eslint-disable @typescript-eslint/no-unused-vars */
import { MessageAttachment } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { Awaitable } from '../../util/constants';
import Battle from './battle';

export interface MonsterOptions {
	name: string;
	description: string;
	fullHP: number;
	image: string;
}

export interface ActOption {
	name: string;
	execute: (this: Monster, battle: Battle) => Awaitable<string | undefined>;
}

abstract class Monster {
	public readonly name: string;
	public readonly description: string;
	public readonly fullHP: number;
	public readonly image: string;
	public hp: number;

	protected _spareable = false;
	protected _fleeable = true;

	public constructor(options: MonsterOptions) {
		this.name = options.name;
		this.description = options.description;
		this.fullHP = options.fullHP;
		this.image = options.image;

		this.hp = this.fullHP;
	}

	public abstract getAttack(check: boolean, battle: Battle): Awaitable<number>;
	public abstract getDefense(check: boolean, battle: Battle): Awaitable<number>;
	public abstract getEXP(battle: Battle): Awaitable<number>;
	public abstract getGold(spared: boolean, battle: Battle): Awaitable<number>;
	public abstract getActOptions(battle: Battle): Awaitable<ActOption[]>;
	public abstract getFlavorText(battle: Battle): Awaitable<string>;

	public getAttackQuote(battle: Battle): Awaitable<string | undefined> {
		return undefined;
	}

	public onSpawn(battle: Battle): Awaitable<void> {}
	public onDamage(damage: number, battle: Battle): Awaitable<void> {}
	public onDeath(battle: Battle): Awaitable<void> {}
	public onSpare(battle: Battle): Awaitable<void> {}

	public attachImage(embed: MessageEmbed) {
		const attachment = new MessageAttachment(
			`./assets/img/monsters/${this.image}`,
			this.image
		);
		embed.attachFiles([attachment]).setThumbnail(`attachment://${this.image}`);
	}

	public get spareable() {
		return this._spareable;
	}

	public get fleeable() {
		return this._fleeable;
	}
}

export default Monster;
