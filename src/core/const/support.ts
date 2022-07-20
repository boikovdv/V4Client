/*!
 * V4Fire Core
 * https://github.com/V4Fire/Core
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Core/blob/master/LICENSE
 */

export * from '@v4fire/core/core/const/support';

export const ResizeObserver =
	Object.isFunction(globalThis.ResizeObserver);

export const IntersectionObserver =
	Object.isFunction(globalThis.IntersectionObserver) &&
	Object.isFunction(globalThis.IntersectionObserverEntry) &&
	'intersectionRatio' in IntersectionObserverEntry.prototype;
