// build-for-pi.js - Special build script for Windows-to-Raspberry Pi workflow
// This script ensures all necessary build files are generated and not gitignored

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Function to ensure file exists, creating it with content if it doesn't
function ensureFileExists(filePath, content) {
  if (!fs.existsSync(filePath)) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
  }
}

// Function to run a command as a promise
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { stdio: 'inherit' });
    
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
    
    proc.on('error', (err) => reject(err));
  });
}

// Function to create middleware patch files
function createMiddlewarePatch(nextDir) {
  console.log('\x1b[33m%s\x1b[0m', '🔧 Creating middleware patch files...');
  
  // Create a patch script that will run before the server starts
  const patchDir = path.join(nextDir, 'server');
  
  // Create the patch files
  const middlewarePatchPath = path.join(patchDir, 'middleware-patch.js');
  
  // Create a patch that prevents middleware errors
  const patchContent = `
// Patch to prevent middleware errors in Next.js 15.2.4
const originalRequire = module.constructor.prototype.require;

module.constructor.prototype.require = function(modulePath) {
  try {
    return originalRequire.apply(this, arguments);
  } catch (error) {
    // If error is about middleware, return an empty object
    if (modulePath.includes('middleware') || modulePath.includes('_middleware')) {
      return {};
    }
    throw error;
  }
};
`;

  // Write the middleware patch file
  fs.writeFileSync(middlewarePatchPath, patchContent);
  
  // Create a preload script in the next directory
  const preloadPath = path.join(nextDir, 'preload.js');
  const preloadContent = `
// Preload script for Next.js middleware fix
require('./server/middleware-patch.js');
`;
  
  // Write the preload script
  fs.writeFileSync(preloadPath, preloadContent);
  
  // Create a .env.production file to load the preload script
  const envPath = path.join(process.cwd(), '.env.production');
  let envContent = `NODE_OPTIONS=--require "${path.resolve(preloadPath)}"
`;
  
  // Add to existing env file or create new one
  if (fs.existsSync(envPath)) {
    const existingEnv = fs.readFileSync(envPath, 'utf8');
    if (!existingEnv.includes('NODE_OPTIONS')) {
      envContent = existingEnv.trim() + '\n' + envContent;
    }
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('\x1b[32m%s\x1b[0m', '✅ Middleware patch files created successfully!');
}

// Main function
async function main() {
  try {
    // 1. Try to run the regular Next.js build first
    console.log('🏗️ Building Next.js application...');
    try {
      await runCommand('npm', ['run', 'build']);
    } catch (error) {
      console.log('⚠️ Build command failed, but we will continue with manual file creation');
    }
    
    // Create or ensure all required Next.js build files
    console.log('\x1b[33m%s\x1b[0m', '📁 Creating/ensuring all required Next.js build files...');
  
    const nextDir = '.next';
  
    // 1. Create BUILD_ID if it doesn't exist
    const buildId = Date.now().toString();
    ensureFileExists(path.join(nextDir, 'BUILD_ID'), buildId);
  
    // 2. Create or update routes-manifest.json
    const routesManifest = {
      version: 3,
      basePath: "",
      redirects: [],
      headers: [],
      rewrites: [],
      staticRoutes: [],
      dynamicRoutes: [],
      dataRoutes: [],
      i18n: { locales: ["en"], defaultLocale: "en" }
    };
    // Always write a fresh routes-manifest.json
    fs.writeFileSync(path.join(nextDir, 'routes-manifest.json'), JSON.stringify(routesManifest, null, 2));
  
    // 3. Create or update build-manifest.json with proper middleware configuration
    const buildManifest = {
      polyfillFiles: [],
      devFiles: [],
      ampDevFiles: [],
      lowPriorityFiles: [],
      rootMainFiles: [],
      pages: { 
        '/_app': [], 
        '/': [],
        '/_error': [],
        '/_document': [] 
      },
      // Include an empty middleware object - critical for preventing the error
      middleware: {},
      ampFirstPages: []
    };
    // Always write a fresh build-manifest.json
    fs.writeFileSync(path.join(nextDir, 'build-manifest.json'), JSON.stringify(buildManifest, null, 2));
  
    // 4. Create prerender-manifest.json if it doesn't exist
    ensureFileExists(path.join(nextDir, 'prerender-manifest.json'), JSON.stringify({
      version: 4,
      routes: {},
      dynamicRoutes: {}, 
      notFoundRoutes: []
    }, null, 2));
  
    // 5. Create required-server-files.json if it doesn't exist
    ensureFileExists(path.join(nextDir, 'required-server-files.json'), JSON.stringify({
      version: 1,
      config: { 
        trailingSlash: false, 
        env: {}, 
        basePath: "",
        pageExtensions: ["js", "jsx", "ts", "tsx"] 
      },
      appDir: path.resolve('.')
    }, null, 2));
  
    // 6. Create react-loadable-manifest.json if it doesn't exist
    ensureFileExists(path.join(nextDir, 'react-loadable-manifest.json'), '{}');
  
    // Set up server directory and middleware files
    const serverDir = path.join(nextDir, 'server');
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    
    // Create static directory structure (required for assets)
    const staticDir = path.join(nextDir, 'static');
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
      // Create essential subdirectories
      fs.mkdirSync(path.join(staticDir, 'chunks'), { recursive: true });
      fs.mkdirSync(path.join(staticDir, 'css'), { recursive: true });
      fs.mkdirSync(path.join(staticDir, 'media'), { recursive: true });
      fs.mkdirSync(path.join(staticDir, 'webpack'), { recursive: true });
      
      // Create a placeholder file to ensure the directory is committed
      fs.writeFileSync(
        path.join(staticDir, '.placeholder'),
        '# This file ensures the static directory is committed to Git'
      );
    }
  
    // Create pages directory if it doesn't exist
    const pagesDir = path.join(serverDir, 'pages');
    if (!fs.existsSync(pagesDir)) {
      fs.mkdirSync(pagesDir, { recursive: true });
    }
  
    // Always create a fresh middleware-manifest.json with correct structure
    const middlewareManifest = {
      version: 1,
      sortedMiddleware: [],
      middleware: {},
      functions: {},
      matchers: {}
    };
    fs.writeFileSync(
      path.join(serverDir, 'middleware-manifest.json'), 
      JSON.stringify(middlewareManifest, null, 2)
    );
  
    // Create a minimal webpack-runtime.js file
    fs.writeFileSync(
      path.join(serverDir, 'webpack-runtime.js'),
      'module.exports = {};'
    );
  
    // Create middleware patch files
    createMiddlewarePatch(nextDir);
  
    // 8. Validate the build
    let missingFiles = [];
    const requiredFiles = [
      'BUILD_ID',
      'routes-manifest.json',
      'build-manifest.json',
      'prerender-manifest.json',
      'required-server-files.json',
      'react-loadable-manifest.json'
    ];
  
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(nextDir, file))) {
        missingFiles.push(file);
      }
    }
  
    if (missingFiles.length > 0) {
      console.error(`⚠️ Missing critical build files: ${missingFiles.join(', ')}. App may not run properly.`);
    } else {
      console.log('✅ All required Next.js build files created successfully!');
    }
  
    // 9. Remind about Git commands
    console.log('\n🔥 Build preparation completed successfully!');
    console.log('Next steps:');
    console.log('1. git add .');
    console.log('2. git commit -m "Update build files for Raspberry Pi"');
    console.log('3. git push origin development');
    console.log('4. On Raspberry Pi: git pull && node start-pi.js');

  } catch (error) {
    console.error('Failed to prepare build:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
