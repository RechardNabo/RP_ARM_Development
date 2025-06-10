// Custom server implementation that bypasses Next.js middleware problems
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Use reduced memory allocation for the Raspberry Pi
const env = {
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=384',
};

// Configure Next.js
const dev = false; // Always use production mode
const hostname = 'localhost';
const port = 3001; // Use port 3001 as per requirements
const app = next({ dev, hostname, port });

// Override Next.js's middleware system
global.__MIDDLEWARE_MANIFEST = { middleware: {}, sortedMiddleware: [] };
global.__MIDDLEWARE_MATCHERS = [];
global.__MIDDLEWARE_FUNCTIONS = {};

// Bypass middleware manifests by directly overriding them
if (fs.existsSync(path.join(process.cwd(), '.next', 'server'))) {
  try {
    // Create a dummy middleware-manifest.json that won't cause errors
    fs.writeFileSync(
      path.join(process.cwd(), '.next', 'server', 'middleware-manifest.json'),
      JSON.stringify({
        version: 1,
        sortedMiddleware: [],
        middleware: {},
        functions: {},
        matchers: []
      }, null, 2)
    );
  } catch (err) {
    console.warn('Could not update middleware manifest:', err.message);
  }
}

// Prepare the app and handle requests
app.prepare().then(() => {
  // Create an HTTP server that directly uses Next.js's request handler
  // This bypasses the middleware system entirely
  const server = createServer((req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Let Next.js handle the request
      app.getRequestHandler()(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Start the server on port 3001
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err);
});
