/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { callMethodFromComponent } from 'core/component/method';
import { resolveRefs } from 'core/component/ref';
import { runHook } from 'core/component/hook';

import type { ComponentInterface } from 'core/component/interface';

/**
 * Initializes the "activated" state to the specified component instance
 * @param component
 */
export function activatedState(component: ComponentInterface): void {
	runHook('beforeActivated', component).catch(stderr);
	resolveRefs(component);

	runHook('activated', component).catch(stderr);
	callMethodFromComponent(component, 'activated');
}
