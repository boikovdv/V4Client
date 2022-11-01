/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:components/traits/i-history/README.md]]
 * @packageDocumentation
 */

import iBlock from 'components/super/i-block/i-block';
import type History from 'components/traits/i-history/history';

export default abstract class iHistory extends iBlock {
	/**
	 * Component history
	 */
	abstract history: History;

	/**
	 * Handler: the visibility state of the top content has been changed
	 * @param state - if true, the top is visible
	 */
	abstract onPageTopVisibilityChange(state: boolean): void;
}
