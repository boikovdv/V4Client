'use strict';

/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

const
	$C = require('collection.js');

const
	config = require('@config/config'),
	webpack = require('webpack');

/**
 * Returns parameters for `webpack.plugins`
 * @returns {!Map}
 */
module.exports = async function plugins({name}) {
	const
		globals = include('build/globals.webpack');

	const
		DependenciesPlugin = include('build/webpack/plugins/dependencies'),
		createProgressPlugin = include('build/webpack/plugins/progress-plugin'),
		IgnoreInvalidWarningsPlugin = include('build/webpack/plugins/ignore-invalid-warnings'),
		I18NGeneratorPlugin = include('build/webpack/plugins/i18n-plugin'),
		StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

	const plugins = new Map([
		['globals', new webpack.DefinePlugin(await $C(globals).async.map())],
		['dependencies', new DependenciesPlugin()],
		['ignoreNotFoundExport', new IgnoreInvalidWarningsPlugin()],
		['i18nGeneratorPlugin', new I18NGeneratorPlugin()]
	]);

	const
		statoscopeConfig = config.statoscope();

	if (statoscopeConfig.enabled) {
		plugins.set(
			'statoscope-webpack-plugin',
			new StatoscopeWebpackPlugin(statoscopeConfig.webpackPluginConfig)
		);
	}

	if (config.webpack.progress()) {
		plugins.set('progress-plugin', createProgressPlugin(name));
	}

	if (config.webpack.fatHTML()) {
		plugins.set('limit-chunk-count-plugin', new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1
		}));
	}

	return plugins;
};
