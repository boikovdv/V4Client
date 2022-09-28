/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import Async from 'core/async';

import { getComponentContext } from 'core/component/context';

import { forkMeta } from 'core/component/meta';
import { getPropertyInfo, PropertyInfo } from 'core/component/reflect';
import { getNormalParent } from 'core/component/traverse';

import { initFields } from 'core/component/field';
import { attachAccessorsFromMeta } from 'core/component/accessor';
import { attachMethodsFromMeta, callMethodFromComponent } from 'core/component/method';

import { runHook } from 'core/component/hook';
import { implementEventEmitterAPI } from 'core/component/event';

import { beforeDestroyState } from 'core/component/init/states/before-destroy';
import { destroyedState } from 'core/component/init/states/destroyed';

import type { ComponentInterface, ComponentMeta, ComponentElement } from 'core/component/interface';
import type { InitBeforeCreateStateOptions } from 'core/component/init/interface';

/**
 * Initializes the "beforeCreate" state to the specified component instance
 *
 * @param component
 * @param meta - the component meta object
 * @param [opts] - additional options
 */
export function beforeCreateState(
	component: ComponentInterface,
	meta: ComponentMeta,
	opts?: InitBeforeCreateStateOptions
): void {
	meta = forkMeta(meta);

	// To avoid TS errors marks all properties as editable
	const unsafe = Object.cast<Writable<ComponentInterface['unsafe']>>(component);

	unsafe.unsafe = unsafe;
	unsafe.componentName = meta.componentName;

	unsafe.meta = meta;
	unsafe.instance = Object.cast(meta.instance);

	unsafe.$fields = {};
	unsafe.$systemFields = {};
	unsafe.$modifiedFields = {};
	unsafe.$renderCounter = 0;

	unsafe.async = new Async(component);
	unsafe.$async = new Async(component);

	Object.defineProperty(unsafe, '$destroy', {
		configurable: true,
		enumerable: false,
		writable: true,
		value: () => {
			if (component.hook !== 'beforeDestroy' && component.hook !== 'destroyed') {
				beforeDestroyState(component);
			}

			if (component.hook !== 'destroyed') {
				destroyedState(component);
			}
		}
	});

	Object.defineProperty(unsafe, '$resolveRef', {
		configurable: true,
		enumerable: false,
		writable: true,
		value: (ref) => {
			if (ref == null) {
				return undefined;
			}

			if (Object.isFunction(ref)) {
				return ref;
			}

			return `${String(ref)}:${unsafe.componentId}`;
		}
	});

	const
		root = unsafe.$root,
		parent = unsafe.$parent;

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (parent != null && parent.componentName == null) {
		Object.defineProperty(unsafe, '$root', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: root.unsafe
		});

		Object.defineProperty(unsafe, '$parent', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: root.$remoteParent ?? null
		});
	}

	unsafe.$normalParent = getNormalParent(component);

	['$root', '$parent', '$normalParent'].forEach((key) => {
		const
			val = unsafe[key];

		if (val != null) {
			Object.defineProperty(unsafe, key, {
				configurable: true,
				enumerable: true,
				writable: false,
				value: getComponentContext(Object.cast(val))
			});
		}
	});

	Object.defineProperty(unsafe, '$children', {
		configurable: true,
		enumerable: true,
		get() {
			const
				{$el} = unsafe;

			if ($el == null) {
				return [];
			}

			return Array.from($el.querySelectorAll<ComponentElement>('.i-block-helper')).map((el) => el.component);
		}
	});

	if (opts?.addMethods) {
		attachMethodsFromMeta(component);
	}

	if (opts?.implementEventAPI) {
		implementEventEmitterAPI(component);
	}

	attachAccessorsFromMeta(component);
	runHook('beforeRuntime', component).catch(stderr);

	const {
		systemFields,
		tiedFields,

		computedFields,
		accessors,

		watchDependencies,
		watchers
	} = meta;

	initFields(systemFields, component, unsafe);

	const
		fakeHandler = () => undefined;

	if (watchDependencies.size > 0) {
		const
			isFunctional = meta.params.functional === true;

		const
			watchSet = new Set<PropertyInfo>();

		watchDependencies.forEach((deps) => {
			deps.forEach((dep) => {
				const
					info = getPropertyInfo(Object.isArray(dep) ? dep.join('.') : String(dep), component);

				if (info.type === 'system' || isFunctional && info.type === 'field') {
					watchSet.add(info);
				}
			});
		});

		// If a computed property has a field or system field as a dependency
		// and the host component does not have any watchers to this field,
		// we need to register the "fake" watcher to force watching
		watchSet.forEach((info) => {
			const needToForceWatching =
				watchers[info.name] == null &&
				watchers[info.originalPath] == null &&
				watchers[info.path] == null;

			if (needToForceWatching) {
				watchers[info.name] = [
					{
						deep: true,
						immediate: true,
						provideArgs: false,
						handler: fakeHandler
					}
				];
			}
		});
	}

	// If a computed property is tied with a field or system field
	// and the host component does not have any watchers to this field,
	// we need to register the "fake" watcher to force watching
	Object.entries(tiedFields).forEach(([name, normalizedName]) => {
		if (normalizedName == null) {
			return;
		}

		const needToForceWatching = watchers[name] == null && (
			accessors[normalizedName] != null ||
			computedFields[normalizedName] != null
		);

		if (needToForceWatching) {
			watchers[name] = [
				{
					deep: true,
					immediate: true,
					provideArgs: false,
					handler: fakeHandler
				}
			];
		}
	});

	runHook('beforeCreate', component).catch(stderr);
	callMethodFromComponent(component, 'beforeCreate');
}
