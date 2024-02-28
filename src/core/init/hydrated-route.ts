/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

import routes from 'routes';
import { getRoute, compileStaticRoutes } from 'core/router';

import type { InitAppParams } from 'core/init/interface';

/**
 * Initializes the initial route of the application
 * @param params
 */
export default async function init(params: InitAppParams): Promise<void> {
	try {
		if (HYDRATION) {
			const
				compiledRoutes = compileStaticRoutes(routes),
				defaultRoute = Object.values(compiledRoutes).find((route) => route?.meta.default);

			const
				routePath = params.location.pathname + params.location.search,
				route = getRoute(routePath, compiledRoutes, {defaultRoute});

			if (route != null) {
				// FIXME: https://github.com/V4Fire/Client/issues/1000
				Object.mixin({propsToCopy: 'new'}, route.meta, route.meta.meta);
				Object.mixin({propsToCopy: 'new'}, route.params, route.meta.params);
				Object.mixin({propsToCopy: 'new'}, route.query, route.meta.query);

				await route.meta.load?.();
				params.route = route;
			}
		}

	} finally {
		void params.ready('hydratedRouteReady');
	}
}
