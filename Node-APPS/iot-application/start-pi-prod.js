const { createServer } = require('http');
const next = require('next');

// Configuration
const port = process.env.PORT || 3001;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Memory optimization for Raspberry Pi
process.env.NODE_OPTIONS = '--max-old-space-size=248';

// Create a custom logger that filters out frequent system metrics requests
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Filter out system metrics API logs
  if (args.length > 0 && typeof args[0] === 'string') {
    if (args[0].includes('GET /api/system/metrics')) {
      return; // Skip logging this message
    }
  }
  // Call the original console.log with the arguments
  originalConsoleLog.apply(console, args);
};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    console.log('SIGTERM received - shutting down');
    server.close(() => {
      process.exit(0);
    });
  });
});
