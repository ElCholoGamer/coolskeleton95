import { Collection } from 'discord.js';
import { join } from 'path';
import Item from '../structures/rpg/item';
import { isModule, readFullDir } from '../util/utils';

class Shop {
	public readonly items: Collection<typeof Item.prototype.id, Item>;

	private constructor(itemList: Item[]) {
		this.items = new Collection(itemList.map(item => [item.id, item]));
	}

	public static async init() {
		const itemFiles = (await readFullDir(join(__dirname, 'items'))).filter(
			isModule
		);

		const items: Item[] = [];

		await Promise.all(
			itemFiles.map(async file => {
				const ItemConstructor = (await import(file)).default;
				if (typeof ItemConstructor !== 'function') return;

				const item = new ItemConstructor();
				if (item instanceof Item) items.push(item);
			})
		);

		return new this(items);
	}

	public findItem(search: number | string | undefined) {
		if (typeof search === 'string') search = search.toLowerCase();

		return (
			this.items.get(Number(search)) ??
			this.items.find(item => item.name.toLowerCase() === search)
		);
	}
}

export default Shop;
