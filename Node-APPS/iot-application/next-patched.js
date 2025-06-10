// Direct patching of Next.js server code to bypass middleware issues
// This script loads and monkey patches Next.js modules before they can fail

// First, apply middleware patches globally
console.log('Applying critical Next.js middleware patches...');

// Define our patches before we require any Next.js modules
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '';
process.env.NODE_OPTIONS = `--max-old-space-size=384 ${process.env.NODE_OPTIONS}`;

// Direct patching of Object prototype to fix middleware issues
Object.defineProperty(Object.prototype, '_middleware', {
  get: function() {
    return [];
  },
  configurable: true
});

Object.defineProperty(Object.prototype, '/_middleware', {
  get: function() {
    return [];
  },
  configurable: true
});

// Create a proxy to intercept module loading
const Module = require('module');
const originalRequire = Module.prototype.require;

// Override require to intercept problematic modules
Module.prototype.require = function(path) {
  try {
    // Try to load the module normally
    return originalRequire.apply(this, arguments);
  } catch (error) {
    // If it's middleware related, return an empty object
    if (path.includes('middleware') || path.includes('_middleware')) {
      console.log(`⚠️ Intercepted problematic module: ${path}`);
      return {};
    }
    // Otherwise, rethrow the error
    throw error;
  }
};

// Now load Next.js
const next = require('next');
const { createServer } = require('http');

// Set up fake middleware manifests globally
global.__MIDDLEWARE_MANIFEST = { middleware: {}, sortedMiddleware: [] };
global.__MIDDLEWARE_MATCHERS = [];

// Create a Next.js app in production mode
const app = next({ 
  dev: false,
  port: 3001,
  hostname: 'localhost'
});

// Prepare the Next.js application
console.log('Starting patched Next.js server on port 3001...');
app.prepare()
  .then(() => {
    const handle = app.getRequestHandler();
    
    // Create an HTTP server with error handling
    const server = createServer((req, res) => {
      try {
        handle(req, res);
      } catch (err) {
        console.error('Request error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
  
    server.listen(3001, (err) => {
      if (err) throw err;
      console.log('✅ Next.js server running on http://localhost:3001');
    });
  })
  .catch(err => {
    console.error('❌ Failed to start Next.js server:', err);
    console.log('Showing error details:');
    console.error(err);
    
    // Try to help diagnose the issue
    console.log('\nPossible solutions:');
    console.log('1. Check if .next/server directory exists and has correct permissions');
    console.log('2. Make sure the build files were properly copied from Windows to Raspberry Pi');
    console.log('3. Try running: NODE_OPTIONS="--max-old-space-size=384" node next-patched.js');
    process.exit(1);
  });
