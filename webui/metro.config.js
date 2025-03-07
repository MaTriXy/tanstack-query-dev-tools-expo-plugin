const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

// Use __dirname directly since we're in CommonJS
const defaultConfig = getDefaultConfig(__dirname);

// Add the parent node_modules to the watch folders
defaultConfig.watchFolders = [
  ...(defaultConfig.watchFolders || []),
  path.resolve(__dirname, "../src"),
  path.resolve(__dirname, "../node_modules"),
];

// Configure the resolver to look in the right places
defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  src: path.resolve(__dirname, "../src"),
  // Add this to help resolve @babel/runtime
  "@babel/runtime": path.resolve(__dirname, "../node_modules/@babel/runtime"),
};

// Make sure Metro can resolve node_modules from the parent directory
defaultConfig.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../node_modules"),
];

module.exports = defaultConfig;
