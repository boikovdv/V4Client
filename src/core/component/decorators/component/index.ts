/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/**
 * [[include:core/component/decorators/component/README.md]]
 * @packageDocumentation
 */

import { identity } from 'core/functools';

import {

	app,

	components,
	rootComponents,

	componentRegInitializers

} from 'core/component/const';

import { initEmitter } from 'core/component/event';
import { createMeta, fillMeta, attachTemplatesToMeta } from 'core/component/meta';
import { getInfoFromConstructor } from 'core/component/reflect';

import { getComponent, ComponentEngine } from 'core/component/engines';
import { registerParentComponents } from 'core/component/init';

import type { ComponentConstructor, ComponentOptions } from 'core/component/interface';

const
	OVERRIDDEN = Symbol('This class is overridden');

/**
 * Registers a new component based on the tied class
 *
 * @decorator
 * @param [opts] - additional options
 *
 * @example
 * ```typescript
 * import iBlock, { component, prop, computed } from 'components/super/i-block/i-block';
 *
 * @component({functional: true})
 * export default class bUser extends iBlock {
 *   @prop(String)
 *   readonly fName: string;
 *
 *   @prop(String)
 *   readonly lName: string;
 *
 *   @computed({cache: true, dependencies: ['fName', 'lName']})
 *   get fullName() {
 *     return `${this.fName} ${this.lName}`;
 *   }
 * }
 * ```
 */
export function component(opts?: ComponentOptions): Function {
	return (target: ComponentConstructor) => {
		const
			componentInfo = getInfoFromConstructor(target, opts),
			componentParams = componentInfo.params;

		if (componentInfo.name === componentInfo.parentParams?.name) {
			Object.defineProperty(componentInfo.parent!, OVERRIDDEN, {value: true});
		}

		initEmitter
			.emit('bindConstructor', componentInfo.name);

		if (!Object.isTruly(componentInfo.name) || componentParams.root || componentInfo.isAbstract) {
			regComponent();

		} else {
			const initList = componentRegInitializers[componentInfo.name] ?? [];
			componentRegInitializers[componentInfo.name] = initList;
			initList.push(regComponent);
		}

		// If we have a smart component,
		// we need to compile two components in the runtime
		if (Object.isPlainObject(componentParams.functional)) {
			component({
				...opts,
				name: `${componentInfo.name}-functional`,
				functional: true
			})(target);
		}

		function regComponent(): void {
			registerParentComponents(componentInfo);

			const
				{parentMeta} = componentInfo;

			const
				meta = createMeta(componentInfo),
				componentName = componentInfo.name;

			if (componentInfo.params.name == null || !componentInfo.isSmart) {
				components.set(target, meta);
			}

			components.set(componentName, meta);
			initEmitter.emit(`constructor.${componentName}`, {meta, parentMeta});

			const noNeedToRegisterAsComponent =
				target.hasOwnProperty(OVERRIDDEN) ||
				componentInfo.isAbstract ||
				!SSR && meta.params.functional === true;

			if (noNeedToRegisterAsComponent) {
				fillMeta(meta, target);

				if (!componentInfo.isAbstract) {
					loadTemplate(meta.component)(identity);
				}

			} else if (meta.params.root) {
				rootComponents[componentName] = new Promise(loadTemplate(getComponent(meta)));

			} else {
				const args = [componentName, loadTemplate(getComponent(meta), true)(identity)] as const;
				ComponentEngine.component(...args);

				if (app.context != null && app.context.component(componentName) == null) {
					app.context.component(...args);
				}
			}

			// Function that waits till a component template is loaded
			function loadTemplate(component: object, lazy: boolean = false): (resolve: Function) => any {
				return promiseCb;

				function promiseCb(resolve: unknown) {
					if (meta.params.tpl === false) {
						return attachTemplatesAndResolve();
					}

					return waitComponentTemplates();

					function waitComponentTemplates() {
						const
							fns = TPLS[meta.componentName];

						if (fns) {
							return attachTemplatesAndResolve(fns);
						}

						if (lazy) {
							return promiseCb;
						}

						requestIdleCallback(waitComponentTemplates, {timeout: 50});
					}

					function attachTemplatesAndResolve(tpls?: Dictionary) {
						attachTemplatesToMeta(meta, tpls);
						return Object.isFunction(resolve) ? resolve(component) : component;
					}
				}
			}
		}
	};
}
