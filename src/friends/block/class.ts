/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import Friend, { fakeMethods } from 'friends/friend';

import type iBlock from 'super/i-block/i-block';
import type { ModsNTable } from 'super/i-block/modules/mods';

import { modRgxpCache } from 'friends/block/const';
import type { ModEvent, ModEventReason, SetModEvent } from 'friends/block/interface';

import type * as element from 'friends/block/element';
import type * as traverse from 'friends/block/traverse';

interface Block {
	getFullElName: typeof element.getFullElName;
	getElMod: typeof element.getElMod;
	setElMod: typeof element.setElMod;
	removeElMod: typeof element.removeElMod;

	getBlockSelector: typeof traverse.getBlockSelector;
	getElSelector: typeof traverse.getElSelector;

	element: typeof traverse.element;
	elements: typeof traverse.elements;
}

@fakeMethods(
	'getFullElName',
	'getElMod',
	'setElMod',
	'removeElMod',

	'getBlockSelector',
	'getElSelector',

	'element',
	'elements'
)

class Block extends Friend {
	/**
	 * A dictionary with applied modifiers
	 */
	protected readonly mods?: Dictionary<CanUndef<string>>;

	constructor(component: iBlock) {
		super(component);
		this.mods = Object.createDict();

		for (let m = component.mods, keys = Object.keys(m), i = 0; i < keys.length; i++) {
			const name = keys[i];
			this.setMod(name, m[name], 'initSetMod');
		}
	}

	/**
	 * Returns the full block name of the tied component
	 *
	 * @param [modName] - an additional modifier name
	 * @param [modValue] - an additional value name
	 *
	 * @example
	 * ```js
	 * // b-foo
	 * console.log(this.getFullBlockName());
	 *
	 * // b-foo_focused_true
	 * console.log(this.getFullBlockName('focused', true));
	 * ```
	 */
	getFullBlockName(modName?: string, modValue?: unknown): string {
		return this.componentName + (modName != null ? `_${modName.dasherize()}_${String(modValue).dasherize()}` : '');
	}

	/**
	 * Returns a value of the specified block modifier
	 *
	 * @param name - the modifier name
	 * @param [fromNode] - if true, then the modifier value will be taken from the tied DOM node instead of cache
	 *
	 * @example
	 * ```js
	 * console.log(this.getMod('focused'));
	 * console.log(this.getMod('focused', true));
	 * ```
	 */
	getMod(name: string, fromNode?: boolean): CanUndef<string> {
		const
			{mods, node} = this;

		if (mods != null && !fromNode) {
			return mods[name.camelize(false)];
		}

		if (node == null) {
			return undefined;
		}

		const
			MOD_VALUE = 2;

		const
			pattern = `(?:^| )(${this.getFullBlockName(name, '')}[^_ ]*)`,
			modifierRgxp = modRgxpCache[pattern] ?? new RegExp(pattern),
			matchedEl = modifierRgxp.exec(node.className);

		modRgxpCache[pattern] = modifierRgxp;
		return matchedEl ? matchedEl[1].split('_')[MOD_VALUE] : undefined;
	}

	/**
	 * Sets a block modifier to the current component.
	 * The method returns false if the modifier is already set.
	 *
	 * @param name - the modifier name to set
	 * @param value - the modifier value to set
	 * @param [reason] - a reason to set the modifier
	 *
	 * @example
	 * ```js
	 * this.setMod('focused', true);
	 * this.setMod('focused', true, 'removeMod');
	 * ```
	 */
	setMod(name: string, value: unknown, reason: ModEventReason = 'setMod'): boolean {
		if (value == null) {
			return false;
		}

		name = name.camelize(false);

		const {
			ctx,
			mods,
			node
		} = this;

		const
			normalizedValue = String(value).dasherize(),
			oldValue = this.getMod(name);

		if (oldValue === normalizedValue) {
			return false;
		}

		const
			isInit = reason === 'initSetMod';

		let
			prevValFromDOM,
			needSync = false;

		if (isInit) {
			prevValFromDOM = this.getMod(name, true);
			needSync = prevValFromDOM !== normalizedValue;
		}

		if (needSync) {
			this.removeMod(name, prevValFromDOM, 'initSetMod');

		} else if (!isInit) {
			this.removeMod(name, undefined, 'setMod');
		}

		if (node != null && (!isInit || needSync)) {
			node.classList.add(this.getFullBlockName(name, normalizedValue));
		}

		if (mods != null) {
			mods[name] = normalizedValue;
		}

		ctx.mods[name] = normalizedValue;

		if (!ctx.isFunctional) {
			const
				watchModsStore = ctx.field.get<ModsNTable>('watchModsStore');

			if (watchModsStore != null && name in watchModsStore && watchModsStore[name] !== normalizedValue) {
				delete Object.getPrototypeOf(watchModsStore)[name];
				ctx.field.set(`watchModsStore.${name}`, normalizedValue);
			}
		}

		if (!isInit) {
			const event: SetModEvent = {
				type: 'set',
				event: 'block.mod.set',
				reason,
				name,
				value: normalizedValue,
				oldValue
			};

			this.localEmitter.emit(`block.mod.set.${name}.${normalizedValue}`, event);
			ctx.emit(`mod:set:${name}:${normalizedValue}`, event);
		}

		return true;
	}

	/**
	 * Removes a block modifier from the current component.
	 * The method returns false if the block does not have this modifier.
	 *
	 * @param name - the modifier name to remove
	 * @param [value] - the modifier value to remove
	 * @param [reason] - a reason to remove the modifier
	 *
	 * @example
	 * ```js
	 * this.removeMod('focused');
	 * this.removeMod('focused', true);
	 * this.removeMod('focused', true, 'setMod');
	 * ```
	 */
	removeMod(name: string, value?: unknown, reason: ModEventReason = 'removeMod'): boolean {
		name = name.camelize(false);
		value = value != null ? String(value).dasherize() : undefined;

		const {
			ctx,
			mods,
			node
		} = this;

		const
			isInit = reason === 'initSetMod',
			currentValue = this.getMod(name, isInit);

		if (currentValue === undefined || value !== undefined && currentValue !== value) {
			return false;
		}

		if (node != null) {
			node.classList.remove(this.getFullBlockName(name, currentValue));
		}

		if (mods != null) {
			mods[name] = undefined;
		}

		const
			needNotify = reason === 'removeMod';

		if (needNotify) {
			ctx.mods[name] = undefined;

			if (!ctx.isFunctional) {
				const
					watchModsStore = ctx.field.get<ModsNTable>('watchModsStore');

				if (watchModsStore != null && name in watchModsStore && watchModsStore[name] != null) {
					delete Object.getPrototypeOf(watchModsStore)[name];
					ctx.field.set(`watchModsStore.${name}`, undefined);
				}
			}
		}

		if (!isInit) {
			const event: ModEvent = {
				type: 'remove',
				event: 'block.mod.remove',
				reason,
				name,
				value: currentValue
			};

			this.localEmitter
				.emit(`block.mod.remove.${name}.${currentValue}`, event);

			if (needNotify) {
				ctx.emit(`mod:remove:${name}:${currentValue}`, event);
			}
		}

		return true;
	}
}

export default Block;
