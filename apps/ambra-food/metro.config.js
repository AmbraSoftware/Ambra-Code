const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the workspace root (monorepo root)
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and extensions
config.resolver = {
  ...config.resolver,
  
  // Disable package exports for better monorepo support
  unstable_enablePackageExports: false,
  
  // Node modules at the workspace root
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
  
  // Extra node modules to resolve from workspace
  extraNodeModules: {
    '@nodum/shared': path.resolve(workspaceRoot, 'packages/shared'),
  },
  
  // Resolve extensions
  sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

module.exports = config;
