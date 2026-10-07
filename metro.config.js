const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
if (!config.resolver.assetExts.includes('wasm')) config.resolver.assetExts.push('wasm');
// Also supports linked dependencies during development; normal npm installs need no extra folder.
const modules = path.join(__dirname, 'node_modules');
if (fs.existsSync(modules) && fs.realpathSync(modules) !== modules) {
  config.watchFolders = [fs.realpathSync(modules)];
}
const originalMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = originalMiddleware ? originalMiddleware(middleware, server) : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    enhanced(req, res, next);
  };
};
module.exports = config;
