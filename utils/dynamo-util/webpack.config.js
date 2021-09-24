const { merge } = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');

const rootConfig = require(path.join(__dirname, '../../webpack.config.build.js'));

const output = merge(rootConfig(__dirname), { plugins: [new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true })] });

module.exports = output;
