const path = require('path');

const nodeModules = path.resolve(__dirname, 'node_modules');
process.env.NODE_PATH = process.env.NODE_PATH
  ? `${nodeModules}${path.delimiter}${process.env.NODE_PATH}`
  : nodeModules;

require('module').Module._initPaths();
