const { createServer } = require('http');
const next = require('next');

// Configuration
const port = process.env.PORT || 3001;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Memory optimization for Raspberry Pi
process.env.NODE_OPTIONS = '--max-old-space-size=248';

// Create a custom logger that filters out frequent system metrics requests and Bluetooth errors
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Skip logging if no arguments
  if (args.length === 0) return originalConsoleLog.apply(console, []);
  
  // Check if it's a string message
  if (typeof args[0] === 'string') {
    const message = args[0];
    
    // Filter out system metrics API logs
    if (message.match(/GET \/api\/system\/metrics.*\d+ms/)) {
      return; // Skip logging this message
    }
    
    // Filter out Bluetooth error messages
    if (message.includes('No Bluetooth controller found') || 
        message.includes('Bluetooth interface initialization')) {
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
