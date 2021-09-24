/* eslint-disable class-methods-use-this */
const path = require('path');
const fs = require('fs');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const mode = process.env.NODE_ENV || 'development';

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
module.exports = (dirname) => {
  const SOURCE_DIR = path.join(dirname, './src/');
  const TARGET_DIR = path.join(dirname, './dist/');

  const filename = 'index.js';
  const entry = path.join(SOURCE_DIR, 'index.ts');

  const plugins = [new ForkTsCheckerWebpackPlugin()];

  return {
    node: {
      global: false,
      __filename: false,
      __dirname: false,
    },
    mode,
    devtool: 'source-map',
    entry,
    target: 'node',
    resolve: {
      extensions: ['.mjs', '.ts', '.js'],
      plugins: [
        new TsconfigPathsPlugin({
          /* options: see below */
        }),
      ],
    },
    output: {
      libraryTarget: 'commonjs2',
      path: TARGET_DIR,
      filename,
    },
    //   externals: [],
    module: {
      rules: [
        {
          type: 'javascript/auto',
          test: /\.mjs$/,
          // resolve: {
          //   fullySpecified: false,
          // },
        },
        {
          test: /.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: path.join(dirname, mode === 'production' ? 'tsconfig.build.json' : 'tsconfig.json'),
              },
            },
          ],
        },
      ],
    },
    plugins,
    externals: [{ 'aws-sdk': 'commonjs aws-sdk', y18n: 'commonjs2 y18n', 'yargs-parser': 'commonjs2 yargs-parser' }],
    optimization: {
      minimize: false,
      //   Turned this off because it apollo server throws error, schema must contain uniquely named types but contains multiple types named "XXX"
    },
  };
};
