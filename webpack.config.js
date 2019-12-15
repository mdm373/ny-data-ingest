/* eslint-disable */
const webpack = require('webpack');

module.exports = {
  output: {
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.IgnorePlugin(/^aws-sdk$/),
    new webpack.IgnorePlugin(/^pg-native$/),
  ],
  target: 'node', 
};