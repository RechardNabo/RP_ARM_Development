// Advanced server for IoT application on Raspberry Pi
// This bypasses Next.js middleware issues while providing API and static file support
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const PORT = 3001;
const NEXT_DIR = path.join(__dirname, '.next');
const PUBLIC_DIR = path.join(__dirname, 'public');
const STATIC_DIR = path.join(NEXT_DIR, 'static');
const SERVER_PAGES_DIR = path.join(NEXT_DIR, 'server', 'pages');

// Track API handlers
const apiHandlers = {};

// MIME types for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

// Helper functions
function serveStaticFile(filePath, contentType, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.log(`File not found: ${filePath}`);
        res.writeHead(404);
        res.end('File not found');
      } else {
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

function serveNextJsPage(pagePath, res) {
  // Create a basic HTML template to render the page
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IoT Application</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
  </style>
  <!-- Load Next.js build files -->
  <script>
    window.__NEXT_DATA__ = {
      props: {},
      page: "${pagePath}",
      query: {},
      buildId: "${fs.existsSync(path.join(NEXT_DIR, 'BUILD_ID')) 
        ? fs.readFileSync(path.join(NEXT_DIR, 'BUILD_ID'), 'utf8') 
        : 'development'}",
    };
  </script>
</head>
<body>
  <div id="__next">
    <h1>IoT Application</h1>
    <p>Your application is running on port ${PORT}</p>
    <p>This is a static rendering of page: ${pagePath}</p>
    <p>For full functionality, we need to resolve the middleware issues</p>
  </div>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

// Register an API handler
function registerApi(route, handler) {
  apiHandlers[route] = handler;
  console.log(`Registered API handler for ${route}`);
}

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Log the request
  console.log(`${req.method} ${pathname}`);

  // Handle favicon requests
  if (pathname === '/favicon.ico') {
    const faviconPath = path.join(PUBLIC_DIR, 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
      serveStaticFile(faviconPath, 'image/x-icon', res);
    } else {
      res.writeHead(204);
      res.end();
    }
    return;
  }
  
  // Check if this is an API route
  if (pathname.startsWith('/api/')) {
    const apiRoute = pathname.substring(4); // Remove /api prefix
    
    if (apiHandlers[apiRoute]) {
      // We have a registered handler for this API
      apiHandlers[apiRoute](req, res, parsedUrl.query);
    } else {
      // Mock API response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'API endpoint not implemented yet',
        path: apiRoute,
        query: parsedUrl.query,
        timestamp: new Date().toISOString()
      }));
    }
    return;
  }
  
  // Check for static files in the public directory
  const publicFilePath = path.join(PUBLIC_DIR, pathname);
  if (fs.existsSync(publicFilePath) && fs.statSync(publicFilePath).isFile()) {
    const ext = path.extname(publicFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    serveStaticFile(publicFilePath, contentType, res);
    return;
  }
  
  // Check for static files in Next.js static directory
  if (pathname.startsWith('/_next/static/')) {
    const staticPath = path.join(NEXT_DIR, pathname.substring(1)); // Remove leading slash
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      const ext = path.extname(staticPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      serveStaticFile(staticPath, contentType, res);
      return;
    }
  }

  // For page requests, serve a basic page template
  // Homepage
  if (pathname === '/' || pathname === '/index.html') {
    serveNextJsPage('/', res);
    return;
  }
  
  // Any other pages
  serveNextJsPage(pathname, res);
});

// Start the server
server.listen(PORT, () => {
  console.log(`IoT Application Server running on http://localhost:${PORT}`);
  console.log(`Access from other devices using your Raspberry Pi's IP address on port ${PORT}`);
});

// Example API registration - you can add your own APIs here
registerApi('/status', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  }));
});

// Register more of your IoT application APIs here
// For example:
registerApi('/devices', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    devices: [
      { id: 1, name: 'Device 1', status: 'online' },
      { id: 2, name: 'Device 2', status: 'offline' }
    ]
  }));
});

console.log('Server initialized with basic API routes for testing');
