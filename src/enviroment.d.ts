import { IGuild } from './models/guild';
import { IUser } from './models/user';
import Shop from './rpg/shop';
import CommandHandler from './structures/command/command-handler';

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: 'development' | 'production';
		}
	}

	interface Math {
		clamp(num: number, min: number, max: number): number;
		randomInt(min: number, max: number): number;
	}

	interface Array<T> {
		random(): T;
		chunk(chunkSize: number): T[][];
	}
}

declare module 'discord.js' {
	interface Client {
		commandHandler: CommandHandler;
		shop: Shop;
	}

	interface Guild {
		getDocument(): Promise<IGuild>;
	}

	interface TextChannel {
		awaitingBattle: boolean;
	}

	interface User {
		inBattle: boolean;
		getDocument(): Promise<IUser>;

		heal(amount: number): Promise<IUser>;
		damage(amount: number): Promise<IUser>;

		addExp(amount: number): Promise<IUser>;

		getGold(): Promise<number>;
		addGold(amount: number): Promise<IUser>;

		addItem(id: number, amount?: number): Promise<IUser>;
		removeItem(id: number, amount?: number): Promise<IUser>;
	}

	interface Message {
		edit(
			content:
				| APIMessageContentResolvable
				| (MessageOptions & { split?: false })
				| MessageAdditions
		): Promise<Message>;
		edit(
			options: MessageOptions & { split: true | SplitOptions }
		): Promise<Message[]>;
		edit(
			options: MessageOptions | discord.APIMessage
		): Promise<Message | Message[]>;
		edit(
			content: StringResolvable,
			options: (MessageOptions & { split?: false }) | MessageAdditions
		): Promise<Message>;
		edit(
			content: StringResolvable,
			options: MessageOptions & { split: true | SplitOptions }
		): Promise<Message[]>;
		edit(
			content: StringResolvable,
			options: MessageOptions
		): Promise<Message | Message[]>;
		edit(
			content: StringResolvable,
			options: MessageButton | MessageActionRow | MessageMenu
		): Promise<Message | Message[]>;
	}
}
