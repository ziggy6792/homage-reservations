const { merge } = require('webpack-merge');
const path = require('path');
const rootConfig = require(path.join(__dirname, '../../webpack.config.build.js'));

const output = merge(rootConfig(__dirname), {
  resolve: {
    // workaround for webpack https://github.com/jaydenseric/graphql-upload/issues/258#issuecomment-897904695
    mainFields: ['main'],
  },
});

module.exports = output;
