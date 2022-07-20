/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

export interface WatchOptions {
	/**
	 * A name of the group this operation belongs to.
	 * This name can be used to disable or suspend multiple items in a single call.
	 */
	group?: PropertyKey;

	/**
	 * An element whose bounds are treated as the bounding box of the viewport for the element which is the
	 * observer target. This option can also be given as a function that returns the root element.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/root
	 */
	root?: Element | (() => Element);

	/**
	 * If true, then after the first intersection handler firing, the observation will be canceled
	 * @default `false`
	 */
	once?: boolean;

	/**
	 * A number which indicate at what percentage of the observable element visibility the intersection callback
	 * should be executed. If you only want to detect when visibility passes the 50% mark, you can use a value of `0.5`.
	 *
	 * The default is `0` (meaning as soon as even one pixel is visible, the handler will be run).
	 * A value of `1.0 `means that the threshold isn't considered passed until every pixel is visible.
	 *
	 * @default `0`
	 */
	threshold: number;

	/**
	 * The minimum delay in milliseconds before calling the intersection handler.
	 * If after this delay the observable element leaves the viewport, then the intersection handler won't be called.
	 */
	delay?: number;

	/**
	 * If true, then the position and geometry of the observable element will be updated every 75 milliseconds using
	 * `getBoundingClientRect`. This strategy is necessary for elements that can change their size or position without
	 * changing in its node tree.
	 *
	 * This option is only meaningful for environments that do not support the native IntersectionObserver API.
	 * Be careful using this option as it can degrade the performance of your application.
	 */
	polling?: boolean;

	/**
	 * A boolean indicating whether the watcher will track changes in the element visibility.
	 * This option is only meaningful for environments that support the native IntersectionObserver2 API.
	 *
	 * Mind, compute of visibility is more expensive than intersection.
	 * For that reason, IntersectionObserver2 is not intended to be used broadly in the way that IntersectionObserver1 is.
	 * IntersectionObserver2 is focused on combating fraud and should be used only when IntersectionObserver1
	 * functionality is truly insufficient.
	 */
	trackVisibility?: boolean;

	/**
	 * A function that returns a boolean whether the intersection handler should be called on the observed element
	 * @param watcher
	 */
	shouldHandle?(watcher: Watcher): AnyToBoolean;

	/**
	 * Handler: the observable element has entered the viewport.
	 * Note that this handler ignores the `shouldHandle` option.
	 *
	 * @param watcher
	 */
	onEnter?(watcher: Watcher): void;

	/**
	 * Handler: the observable element has leaved the viewport.
	 * Note that this handler ignores the `shouldHandle` option.
	 *
	 * @param watcher
	 */
	onLeave?(watcher: Watcher): void;
}

export interface UnwatchOptions {
	/**
	 * Threshold for which the handler needs to be removed
	 */
	threshold?: number;

	/**
	 * If true, the element observation won't be canceled, but suspended.
	 * You can later resume observing the element with the `unsuspend` method.
	 */
	suspend?: boolean;
}

export interface Watcher extends Readonly<WatchOptions> {
	/**
	 * The unique watcher identifier
	 */
	readonly id: string;

	/**
	 * The observed element
	 */
	readonly target: Element;

	/**
	 * The observable target size
	 */
	readonly size: ElementSize;

	/**
	 * True if the observable target has left the viewport
	 */
	readonly isLeaving: boolean;

	/**
	 * The time the observed target entered the viewport relative to the time at which the document was created
	 */
	readonly timeIn?: DOMHighResTimeStamp;

	/**
	 * The time the observed target left the viewport relative to the time at which the document was created
	 */
	readonly timeOut?: DOMHighResTimeStamp;

	/**
	 * The time at which the observable target element experienced the intersection change.
	 * The time is specified in milliseconds since the creation of the containing document.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry/time
	 */
	readonly time?: DOMHighResTimeStamp;
}

export interface ElementSize {
	width: number;
	height: number;
}

export interface ElementRect extends ElementSize {
	top: number;
	left: number;
	bottom: number;
	right: number;
}
