import { MessageActionRow, MessageButton } from 'discord-buttons';
import { readdir, stat } from 'fs/promises';
import { resolve } from 'path';

export const removeExtension = (file: string) => file.replace(/\.[^.]*$/, '');

export async function readFullDir(dir: string): Promise<string[]> {
	const result: string[] = [];
	const list = await readdir(dir);

	for (const file of list) {
		const path = resolve(dir, file);
		const fileStat = await stat(path);

		if (fileStat.isDirectory()) {
			const subFiles = await readFullDir(path);
			result.push(...subFiles);
		} else {
			result.push(path);
		}
	}

	return result;
}

export const formatList = (list: any[]) => list.map(e => `\`${e}\``).join(', ');

export const formatPermissions = (list: any[]) =>
	list.map(perm => `\`${perm.toString().replace(/-/g, ' ')}\``);

export function sleep(time: number) {
	return new Promise<number>(resolve => setTimeout(() => resolve(time), time));
}

export const getMaxHP = (lv: number) => 16 + lv * 4;

export const isModule = (file: string) => /\.(js|ts)$/i.test(file);

export function selectButton(id: string, components: MessageActionRow[]) {
	const newComponents: MessageActionRow[] = [];

	for (const actionRow of components) {
		const newRow = new MessageActionRow();

		for (const button of actionRow.components as MessageButton[]) {
			const newButton = new MessageButton()
				.setDisabled(true)
				.setID(button.custom_id)
				.setLabel(button.label);

			if (button.emoji) newButton.setEmoji(button.emoji?.id);

			if (button.custom_id === id) {
				newButton.setStyle('blurple');
			} else {
				newButton.setStyle(button.style);
			}

			newRow.addComponent(newButton);
		}

		newComponents.push(newRow);
	}

	return newComponents;
}
