// GameApp/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const sharedRoot  = path.resolve(projectRoot, '../shared');

const config = getDefaultConfig(projectRoot);

// Watch shared folder for hot-reload
config.watchFolders = [sharedRoot];

// Alias @shared for both native and web
config.resolver.extraNodeModules = {
  '@shared': sharedRoot,
};

// Ensure Metro can resolve modules from shared folder
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@shared/')) {
    const filePath = moduleName.replace('@shared/', '');
    return {
      filePath: path.resolve(sharedRoot, filePath + '.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
