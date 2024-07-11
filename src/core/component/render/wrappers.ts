/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

/* eslint-disable prefer-spread */

import { app, isComponent, componentRenderFactories, destroyedHooks, ASYNC_RENDER_ID } from 'core/component/const';
import { attachTemplatesToMeta, ComponentMeta } from 'core/component/meta';

import { isSmartComponent } from 'core/component/reflect';
import { createVirtualContext } from 'core/component/functional';

import type {

	resolveComponent,
	resolveDynamicComponent,

	createVNode,
	createElementVNode,

	createBlock,
	createElementBlock,

	mergeProps,
	renderList,
	renderSlot,

	withCtx,
	withDirectives,
	resolveDirective,

	VNode,
	DirectiveArguments,
	DirectiveBinding

} from 'core/component/engines';

import type { ssrRenderSlot as ISSRRenderSlot } from '@vue/server-renderer';

import { registerComponent } from 'core/component/init';

import {

	isHandler,

	resolveAttrs,
	normalizePatchFlagUsingProps,
	normalizeComponentAttrs,

	setVNodePatchFlags,
	mergeProps as merge

} from 'core/component/render/helpers';

import type { ComponentInterface } from 'core/component/interface';

/**
 * Wrapper for the component library `createVNode` function
 * @param original
 */
export function wrapCreateVNode<T extends typeof createVNode>(original: T): T {
	return wrapCreateBlock(original);
}

/**
 * Wrapper for the component library `createElementVNode` function
 * @param original
 */
export function wrapCreateElementVNode<T extends typeof createElementVNode>(original: T): T {
	return Object.cast(function createElementVNode(this: ComponentInterface, ...args: Parameters<T>) {
		args[3] = normalizePatchFlagUsingProps(args[3], args[1]);
		return resolveAttrs.call(this, original.apply(null, args));
	});
}

/**
 * Wrapper for the component library `createBlock` function
 * @param original
 */
export function wrapCreateBlock<T extends typeof createBlock>(original: T): T {
	return Object.cast(function wrapCreateBlock(this: ComponentInterface, ...args: Parameters<T>) {
		let
			[name, attrs, slots, patchFlag, dynamicProps] = args;

		let
			component: CanNull<ComponentMeta> = null;

		patchFlag = normalizePatchFlagUsingProps(patchFlag, attrs);

		if (Object.isString(name)) {
			component = registerComponent(name);

		} else if (!Object.isPrimitive(name) && 'name' in name) {
			component = registerComponent(name.name);
		}

		const createVNode: (...args: Parameters<typeof createBlock>) => VNode = (
			type,
			props,
			children,
			patchFlag,
			dynamicProps
		) => {
			const vnode = original(type, props, children, patchFlag, dynamicProps);
			return resolveAttrs.call(this, vnode);
		};

		if (component == null) {
			return createVNode(name, attrs, slots, patchFlag, dynamicProps);
		}

		attrs = normalizeComponentAttrs(attrs, dynamicProps, component);

		const
			{componentName, params} = component,
			{r} = this.$renderEngine;

		const
			isRegular = params.functional !== true,
			vnode = createVNode(name, attrs, isRegular ? slots : [], patchFlag, dynamicProps);

		vnode.props ??= {};
		vnode.props.getRoot ??= this.$getRoot(this);

		vnode.props.getParent ??= () => vnode.virtualParent?.value != null ?
			vnode.virtualParent.value :
			this;

		if (!SSR && vnode.ref != null && vnode.ref.i == null) {
			vnode.ref.i ??= {
				refs: this.$refs,
				setupState: {}
			};
		}

		if (isRegular) {
			return vnode;
		}

		if (componentRenderFactories[componentName] == null) {
			attachTemplatesToMeta(component, TPLS[componentName]);
		}

		const virtualCtx = createVirtualContext(component, {
			parent: this,
			props: attrs,
			slots
		});

		vnode.virtualComponent = virtualCtx;

		const
			declaredProps = component.props,
			functionalVNode = virtualCtx.render(virtualCtx, []);

		const filteredAttrs = Object.fromEntries(
			Object.entries({...vnode.props}).filter(([key]) => declaredProps[key.camelize(false)] == null)
		);

		vnode.type = functionalVNode.type;
		vnode.props = merge(filteredAttrs, functionalVNode.props ?? {});

		vnode.children = functionalVNode.children;
		vnode.dynamicChildren = functionalVNode.dynamicChildren;

		vnode.dirs = Array.concat([], vnode.dirs, functionalVNode.dirs);
		vnode.dirs.push({
			dir: Object.cast(r.resolveDirective.call(virtualCtx, 'hook')),

			modifiers: {},
			arg: undefined,

			value: {
				created: (n: Element) => virtualCtx.$emit('[[COMPONENT_HOOK]]', 'created', n),

				beforeMount: (n: Element) => virtualCtx.$emit('[[COMPONENT_HOOK]]', 'beforeMount', n),
				mounted: (n: Element) => virtualCtx.$emit('[[COMPONENT_HOOK]]', 'mounted', n),

				beforeUpdate: (n: Element) => virtualCtx.$emit('[[COMPONENT_HOOK]]', 'beforeUpdate', n),
				updated: (n: Element) => virtualCtx.$emit('[[COMPONENT_HOOK]]', 'updated', n),

				beforeUnmount: (n: Element) => {
					// A component might have already been removed by explicitly calling $destroy
					if (destroyedHooks[virtualCtx.hook] != null) {
						return;
					}

					virtualCtx.$emit('[[COMPONENT_HOOK]]', 'beforeDestroy', n);
				},

				unmounted: (n: Element) => {
					// A component might have already been removed by explicitly calling $destroy
					if (destroyedHooks[virtualCtx.hook] != null) {
						return;
					}

					virtualCtx.$emit('[[COMPONENT_HOOK]]', 'destroyed', n);
				}
			},

			oldValue: undefined,
			instance: Object.cast(virtualCtx)
		});

		if (vnode.shapeFlag < functionalVNode.shapeFlag) {
			// eslint-disable-next-line no-bitwise
			vnode.shapeFlag |= functionalVNode.shapeFlag;
		}

		if (vnode.patchFlag < functionalVNode.patchFlag) {
			// eslint-disable-next-line no-bitwise
			vnode.patchFlag |= functionalVNode.patchFlag;
		}

		if (!SSR && Object.size(functionalVNode.dynamicProps) > 0) {
			vnode.dynamicProps ??= [];
			functionalVNode.dynamicProps?.forEach((propName) => {
				if (isHandler.test(propName)) {
					vnode.dynamicProps!.push(propName);
					setVNodePatchFlags(vnode, 'props');
				}
			});
		}

		functionalVNode.ignore = true;
		functionalVNode.props = {};
		functionalVNode.dirs = null;
		functionalVNode.children = [];
		functionalVNode.dynamicChildren = [];

		return vnode;
	});
}

/**
 * Wrapper for the component library `createElementBlock` function
 * @param original
 */
export function wrapCreateElementBlock<T extends typeof createElementBlock>(original: T): T {
	return Object.cast(function createElementBlock(this: ComponentInterface, ...args: Parameters<T>) {
		args[3] = normalizePatchFlagUsingProps(args[3], args[1]);
		return resolveAttrs.call(this, original.apply(null, args));
	});
}

/**
 * Wrapper for the component library `resolveComponent` or `resolveDynamicComponent` functions
 * @param original
 */
export function wrapResolveComponent<T extends typeof resolveComponent | typeof resolveDynamicComponent>(
	original: T
): T {
	return Object.cast(function resolveComponent(this: ComponentInterface, name: string) {
		if (SSR) {
			name = name.replace(isSmartComponent, '');
		}

		const
			component = registerComponent(name);

		if (component?.params.functional === true) {
			return name;
		}

		const {context: appCtx} = SSR ? this.app : app;

		if (isComponent.test(name) && appCtx != null) {
			return appCtx.component(name) ?? original(name);
		}

		return original(name);
	});
}

/**
 * Wrapper for the component library `resolveDirective` function
 * @param original
 */
export function wrapResolveDirective<T extends typeof resolveDirective>(
	original: T
): T {
	return Object.cast(function resolveDirective(this: ComponentInterface, name: string) {
		const {context: appCtx} = SSR ? this.app : app;
		return appCtx != null ? appCtx.directive(name) ?? original(name) : original(name);
	});
}

/**
 * Wrapper for the component library `mergeProps` function
 * @param original
 */
export function wrapMergeProps<T extends typeof mergeProps>(original: T): T {
	return Object.cast(function mergeProps(this: ComponentInterface, ...args: Parameters<T>) {
		const
			props = original.apply(null, args);

		if (SSR) {
			return resolveAttrs.call(this, {props}).props;
		}

		return props;
	});
}

/**
 * Wrapper for the component library `renderList` function
 *
 * @param original
 * @param withCtx
 */
export function wrapRenderList<T extends typeof renderList, C extends typeof withCtx>(original: T, withCtx: C): T {
	return Object.cast(function renderList(
		this: ComponentInterface,
		src: Iterable<unknown> | Dictionary | number | undefined | null,
		cb: AnyFunction
	) {
		const
			ctx = this.$renderEngine.r.getCurrentInstance(),

			// Preserve rendering context for the async render
			wrappedCb: AnyFunction = Object.cast(withCtx(cb, ctx));

		const
			vnodes = original(src, wrappedCb),
			asyncRenderId = src?.[ASYNC_RENDER_ID];

		if (asyncRenderId != null) {
			this.$emit('[[V_FOR_CB]]', {wrappedCb});

			Object.defineProperty(vnodes, ASYNC_RENDER_ID, {
				writable: false,
				enumerable: false,
				configurable: false,
				value: asyncRenderId
			});
		}

		return vnodes;
	});
}

/**
 * Wrapper for the component library `renderSlot` function
 * @param original
 */
export function wrapRenderSlot<T extends typeof renderSlot>(original: T): T {
	return Object.cast(function renderSlot(this: ComponentInterface, ...args: Parameters<T>) {
		const
			{r} = this.$renderEngine;

		if (this.meta.params.functional === true) {
			try {
				return original.apply(null, args);

			} catch {
				const [
					slots,
					name,
					props,
					fallback
				] = args;

				const children = slots[name]?.(props) ?? fallback?.() ?? [];
				return r.createBlock.call(this, r.Fragment, {key: props?.key ?? `_${name}`}, children);
			}
		}

		return this.$withCtx(() => original.apply(null, args));
	});
}

/**
 * Wrapper for the component library `withCtx` function
 * @param original
 */
export function wrapWithCtx<T extends typeof withCtx>(original: T): T {
	return Object.cast(function withCtx(this: ComponentInterface, fn: Function) {
		return original((...args: unknown[]) => {
			if (args.length === 1) {
				return fn(args[0], args[0]);
			}

			// If the original function expects more arguments than provided, we explicitly set them to `undefined`,
			// to then add another, "unregistered" argument
			if (fn.length - args.length > 0) {
				args = args.concat(new Array(fn.length - args.length).fill(undefined));
			}

			return fn(...args.concat(args[0]));
		});
	});
}

/**
 * Wrapper for the component library `withDirectives` function
 * @param _
 */
export function wrapWithDirectives<T extends typeof withDirectives>(_: T): T {
	return Object.cast(function withDirectives(
		this: CanUndef<ComponentInterface>,
		vnode: VNode,
		dirs: DirectiveArguments
	) {
		const that = this;
		patchVNode(vnode);

		const bindings = vnode.dirs ?? [];
		vnode.dirs = bindings;

		const instance = this?.unsafe.meta.params.functional === true ?
			Object.cast(this.$normalParent) :
			this;

		dirs.forEach((decl) => {
			const
				[dir, value, arg, modifiers] = decl;

			const binding: DirectiveBinding = {
				dir: Object.isFunction(dir) ? {created: dir, mounted: dir} : dir,
				instance: Object.cast(instance),

				virtualContext: vnode.virtualContext,
				virtualComponent: vnode.virtualComponent,

				value,
				oldValue: undefined,

				arg,
				modifiers: modifiers ?? {}
			};

			const
				cantIgnoreDir = value != null || decl.length !== 2;

			if (Object.isDictionary(dir)) {
				if (Object.isFunction(dir.beforeCreate)) {
					const
						newVnode = dir.beforeCreate(binding, vnode);

					if (newVnode != null) {
						vnode = newVnode;
						patchVNode(vnode);
					}

					if (Object.keys(dir).length > 1 && cantIgnoreDir) {
						bindings.push(binding);
					}

				} else if (Object.keys(dir).length > 0 && cantIgnoreDir) {
					bindings.push(binding);
				}

			} else if (cantIgnoreDir) {
				bindings.push(binding);
			}
		});

		return vnode;

		function patchVNode(vnode: VNode) {
			if (that == null) {
				Object.defineProperty(vnode, 'virtualComponent', {
					configurable: true,
					enumerable: true,
					get: () => vnode.el?.component
				});

			} else if (!('virtualContext' in vnode)) {
				Object.defineProperty(vnode, 'virtualContext', {
					configurable: true,
					enumerable: true,
					writable: true,
					value: that
				});
			}
		}
	});
}

/**
 * Decorates the given component API and returns it
 *
 * @param path - the path from which the API was loaded
 * @param api
 */
export function wrapAPI<T extends Dictionary>(this: ComponentInterface, path: string, api: T): T {
	type BufItems = Array<Parameters<Parameters<typeof ISSRRenderSlot>[4]>[0]>;

	if (path === 'vue/server-renderer') {
		api = {...api};

		if (Object.isFunction(api.ssrRenderComponent)) {
			const {ssrRenderComponent} = api;

			Object.set(api, 'ssrRenderComponent', (
				component: {name: string},
				props: Nullable<Dictionary>,
				...args: unknown[]
			) => {
				const
					meta = registerComponent(component.name);

				if (meta != null) {
					props = normalizeComponentAttrs(props, [], meta);
				}

				return ssrRenderComponent(component, props, ...args);
			});
		}

		if (Object.isFunction(api.ssrRenderSlot)) {
			const {ssrRenderSlot} = api;

			Object.set(api, 'ssrRenderSlot', (...args: Parameters<typeof ISSRRenderSlot>) => {
				const
					slotName = args[1],
					cacheKey = `${this.globalName}-${slotName}`,
					push = args[args.length - 2];

				const canCache =
					'$ssrCache' in this && this.$ssrCache != null && !this.$ssrCache.has(cacheKey) &&
					'globalName' in this && this.globalName != null &&
					Object.isFunction(push);

				if (canCache) {
					const buf: BufItems = [];

					args[args.length - 2] = (str) => {
						buf.push(str);
						push(str);
					};

					const res = ssrRenderSlot(...args);

					unrollBuffer(buf)
						.then((res) => this.$ssrCache!.set(cacheKey, res))
						.catch(stderr);

					return res;
				}

				return ssrRenderSlot(...args);
			});
		}
	}

	return api;

	async function unrollBuffer(buf: BufItems): Promise<string> {
		let res = '';

		for (let val of buf) {
			if (Object.isPromise(val)) {
				val = await val;
			}

			if (Object.isString(val)) {
				res += val;
				continue;
			}

			res += await unrollBuffer(val);
		}

		return res;
	}
}
