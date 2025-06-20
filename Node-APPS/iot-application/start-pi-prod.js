const { createServer } = require('http');
const next = require('next');

// Configuration
const port = process.env.PORT || 3001;
const dev = process.env.NODE_ENV !== 'production';

// Performance and memory optimizations for Raspberry Pi
process.env.NODE_OPTIONS = '--max-old-space-size=800'; // Increased for better compilation performance
process.env.NEXT_TELEMETRY_DISABLED = '1'; // Disable telemetry
process.env.NEXT_WEBPACK_WORKERS = '1'; // Limit webpack workers

// Use production mode to skip dev optimizations if not explicitly in dev mode
if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = 'production';
}

const app = next({ dev });
const handle = app.getRequestHandler();

// Create a custom logger that filters out frequent API requests and error messages
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Skip logging if no arguments
  if (args.length === 0) return originalConsoleLog.apply(console, []);
  
  // Check if it's a string message
  if (typeof args[0] === 'string') {
    const message = args[0];
    
    // Filter out API endpoint logs that flood the terminal
    if (
      // System metrics API calls
      message.match(/GET \/api\/system\/metrics.*\d+ms/) ||
      // Hardware status API calls
      message.match(/GET \/api\/hardware\/status.*\d+ms/) ||
      // Network status API calls
      message.match(/GET \/api\/network\/status.*\d+ms/) ||
      // Any other API calls that are frequent
      message.match(/GET \/api\/[a-zA-Z\/]+.*\d+ms/)
    ) {
      return; // Skip logging this message
    }
    
    // Filter out common error messages
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
