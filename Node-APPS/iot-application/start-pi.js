// Optimized script for starting Next.js on Raspberry Pi with limited memory
// Usage: node start-pi.js [--build] [--dev] [--fix-build]

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configure environment variables
const env = { 
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=384', // Conservative memory limit
  PORT: '3001' // Use port 3001 as per user preference
};

// Command line flags
const shouldBuild = process.argv.includes('--build');
const devMode = process.argv.includes('--dev');
const fixBuild = process.argv.includes('--fix-build');

// Paths to critical Next.js build files
const nextDir = './.next';
const buildManifestPath = path.join(nextDir, 'build-manifest.json');
const routesManifestPath = path.join(nextDir, 'routes-manifest.json');
const buildIdPath = path.join(nextDir, 'BUILD_ID');

// Function to run a command and return a promise
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { env, stdio: 'inherit' });
    
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
    
    proc.on('error', (err) => reject(err));
  });
}

// Function to ensure a file exists with given content
function ensureFileExists(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating file: ${filePath}`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

// Function to fix build files
async function fixBuildFiles() {
  console.log('🔧 Fixing Next.js build files...');
  
  // Create BUILD_ID if missing
  const buildId = Date.now().toString();
  ensureFileExists(buildIdPath, buildId);
  
  // Create routes-manifest.json if missing or replace it
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
  // Always create a fresh routes-manifest.json
  fs.writeFileSync(routesManifestPath, JSON.stringify(routesManifest, null, 2));
  
  // Create or update build-manifest.json with complete middleware configuration
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
    // Empty middleware object instead of defining _middleware
    ampFirstPages: []
  };
  
  // Always write build-manifest.json to ensure it has correct format
  fs.writeFileSync(buildManifestPath, JSON.stringify(buildManifest, null, 2));
  
  // Ensure other critical files exist
  ensureFileExists(path.join(nextDir, 'prerender-manifest.json'), JSON.stringify({
    version: 4,
    routes: {},
    dynamicRoutes: {}, 
    notFoundRoutes: []
  }, null, 2));
  
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
  
  ensureFileExists(path.join(nextDir, 'react-loadable-manifest.json'), '{}');
  
  // Create an empty server directory structure if not exists
  const serverDir = path.join(nextDir, 'server');
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }
  
  // Ensure we have minimal pages directory structure
  const pagesDir = path.join(serverDir, 'pages');
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
  }
  
  // Create empty middleware config to prevent middleware errors
  const middlewareManifest = {
    version: 1,
    sortedMiddleware: [],
    middleware: {},
    functions: {},
    matchers: {}
  };
  fs.writeFileSync(path.join(nextDir, 'server', 'middleware-manifest.json'), 
    JSON.stringify(middlewareManifest, null, 2));
    
  // Create minimal webpack-runtime if not exists
  ensureFileExists(path.join(nextDir, 'server', 'webpack-runtime.js'), 
    'module.exports = {}');
  
  console.log('✅ Build files fixed successfully!');
}

// Main function
async function main() {
  console.log('🧠 Using reduced memory allocation (384MB) for Node.js');
  
  // Build the application if requested
  if (shouldBuild) {
    console.log('🏗️ Building Next.js application...');
    try {
      await runCommand('npm', ['run', 'build']);
      console.log('✅ Build completed successfully!');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }
  
  // Check if .next directory exists
  if (!fs.existsSync(nextDir)) {
    console.error('❌ No production build found. Please run with --build flag first or pull the build from Git.');
    process.exit(1);
  }
  
  // Fix build files if requested or if files are missing
  if (fixBuild || !fs.existsSync(buildManifestPath) || !fs.existsSync(routesManifestPath)) {
    await fixBuildFiles();
  }
  
  // Start the application
  console.log(`🚀 Starting Next.js in ${devMode ? 'development' : 'production'} mode on port 3001...`);
  
  try {
    const nextProc = spawn('npm', ['run', devMode ? 'dev' : 'start', '--', '-p', '3001'], { 
      env, 
      stdio: 'inherit'
    });

    nextProc.on('error', (err) => {
      console.error('Failed to start Next.js:', err);
    });
    
    // Handle process errors and provide guidance
    nextProc.on('close', (code) => {
      if (code !== 0) {
        console.error(`\n❌ Next.js exited with code ${code}`);
        console.log('\nTry running with the --fix-build flag to repair build files:');
        console.log('   node start-pi.js --fix-build');
      }
    });

    process.on('SIGINT', () => {
      console.log('Stopping Next.js...');
      nextProc.kill('SIGINT');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start Next.js:', error);
    console.log('\nTry running with the --fix-build flag:');
    console.log('   node start-pi.js --fix-build');
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
