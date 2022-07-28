/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:core/dom/intersection-watcher/README.md]]
 * @packageDocumentation
 */

import IntersectionWatcher from 'core/dom/intersection-watcher/engines';

export * from 'core/dom/intersection-watcher/interface';
export { IntersectionWatcher as default };

const
	intersectionWatcher = new IntersectionWatcher();

export const
	watch = intersectionWatcher.watch.bind(intersectionWatcher),
	unwatch = intersectionWatcher.unwatch.bind(intersectionWatcher);
