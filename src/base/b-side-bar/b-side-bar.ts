/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import iMessage, { component } from 'super/i-message/i-message';
export * from 'super/i-message/i-message';

@component()
export default class bSideBar extends iMessage {
	/** @override */
	protected convertStateToStorage(): Dictionary {
		return {
			'mods.opened': this.mods.opened
		};
	}
}
