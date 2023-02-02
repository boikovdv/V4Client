/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:core/component/README.md]]
 * @packageDocumentation
 */

import 'core/component/directives';

import * as init from 'core/component/init';
import globalState from 'core/component/state';

export { init, globalState };
export { ComponentEngine as default } from 'core/component/engines';

export { runHook } from 'core/component/hook';
export { bindRemoteWatchers, customWatcherRgxp } from 'core/component/watch';

export { callMethodFromComponent } from 'core/component/method';
export { normalizeClass, normalizeStyle } from 'core/component/render';
export { default as hydrationStore } from 'core/component/hydration';

export {

	app,

	isComponent,
	rootComponents,

	PARENT

} from 'core/component/const';

export {

	initEmitter,
	globalEmitter,

	resetComponents,
	ComponentResetType

} from 'core/component/event';

export * from 'core/component/reflect';
export * from 'core/component/decorators';
export * from 'core/component/interface';
