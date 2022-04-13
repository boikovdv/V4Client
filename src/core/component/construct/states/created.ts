/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import { unmute } from 'core/object/watch';

import { callMethodFromComponent } from 'core/component/method';
import { runHook } from 'core/component/hook';

import type { ComponentInterface, Hook } from 'core/component/interface';

const
	remoteActivationLabel = Symbol('Remote activation label');

/**
 * Initializes the "created" state to the specified component instance
 * @param component
 */
export function createdState(component: ComponentInterface): void {
	const {
		unsafe,
		unsafe: {
			$root: r,
			$async: $a,
			$normalParent: parent
		}
	} = component;

	unmute(unsafe.$fields);
	unmute(unsafe.$systemFields);

	const isDynamicallyMountedComponent =
		parent != null &&
		'$remoteParent' in r;

	if (isDynamicallyMountedComponent) {
		const
			p = parent.unsafe,
			destroy = unsafe.$destroy.bind(unsafe);

		p.$on('on-component-hook:before-destroy', destroy);
		$a.worker(() => p.$off('on-component-hook:before-destroy', destroy));

		const isRegularComponent =
			unsafe.meta.params.functional !== true &&
			!unsafe.isFlyweight;

		if (isRegularComponent) {
			const activationHooks = Object.createDict({
				activated: true,
				deactivated: true
			});

			const onActivation = (status: Hook) => {
				if (activationHooks[status] == null) {
					return;
				}

				if (status === 'deactivated') {
					component.deactivate();
					return;
				}

				$a.requestIdleCallback(component.activate.bind(component), {
					label: remoteActivationLabel,
					timeout: 50
				});
			};

			if (activationHooks[p.hook] != null) {
				onActivation(p.hook);
			}

			p.$on('on-component-hook-change', onActivation);
			$a.worker(() => p.$off('on-component-hook-change', onActivation));
		}
	}

	runHook('created', component).then(() => {
		callMethodFromComponent(component, 'created');
	}).catch(stderr);
}
