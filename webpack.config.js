const path = require("path");
var nodeExternals = require('webpack-node-externals');
var pkg = require("./package.json");

 // lambda already has these globally, no need to bundle
const excludedModules = {
    "aws-sdk": true
}

const whitelist = Object.keys(pkg.dependencies).filter((dep) => !excludedModules[dep]).map((dep) => new RegExp(`^${dep}(\/)*(.*)`))

console.log(`node externals will include: ${whitelist}`)

module.exports = {
    output: {
        libraryTarget: 'umd',
    },
    target: "node",
    externals: nodeExternals({whitelist}),
};