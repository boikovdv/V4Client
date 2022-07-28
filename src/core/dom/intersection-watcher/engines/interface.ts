/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import type { ElementSize, Watcher, WatchLink } from 'core/dom/intersection-watcher/interface';

export interface ScrollRect extends ElementSize {
	scrollTop: number;
	scrollLeft: number;
}

export interface ElementPosition extends ElementSize {
	top: number;
	left: number;
	bottom: number;
	right: number;
}

export interface WatcherPosition extends ElementPosition {
	watcher: Watcher;
}

export type RegisteredWatchers = Map<WatchLink, Watcher | Set<Watcher>>;
export type ObservableElements = Map<Element, RegisteredWatchers>;
