const { createServer } = require('http');
const next = require('next');

// Configuration
const port = process.env.PORT || 3001;
const dev = process.env.NODE_ENV !== 'production';

// Performance and memory optimizations for Raspberry Pi
process.env.NODE_OPTIONS = '--max-old-space-size=800'; // Increased for better compilation performance
process.env.NEXT_TELEMETRY_DISABLED = '1'; // Disable telemetry
process.env.NEXT_WEBPACK_WORKERS = '1'; // Limit webpack workers

// COMPLETELY DISABLE NEXT.JS LOGGING
process.env.NEXT_DISABLE_LOGS = '1';
// Disable HTTP logging
process.env.NEXT_DISABLE_HTTP_LOGS = '1';
// Disable server logging
process.env.NEXT_DISABLE_SERVER_LOGS = '1';
// Minimize all other logs
process.env.NODE_ENV = 'production';

const app = next({ dev: false, quiet: true }); // Force quiet mode
const handle = app.getRequestHandler();

// COMPLETELY DISABLE ALL LOGS

// Save original stdout and stderr write methods
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

// Replace stdout.write with filtered version
process.stdout.write = function(chunk, encoding, callback) {
  const str = chunk.toString();
  
  // Block all API-related output
  if (
    str.includes('/api/') || 
    str.includes('GET') || 
    str.includes('system/metrics') || 
    str.includes('hardware/status')
  ) {
    // Silently drop the output
    if (callback) callback();
    return true;
  }
  
  // Allow everything else
  return originalStdoutWrite.apply(process.stdout, arguments);
};

// Replace stderr.write with filtered version
process.stderr.write = function(chunk, encoding, callback) {
  const str = chunk.toString();
  
  // Block all API-related errors
  if (
    str.includes('/api/') || 
    str.includes('GET') || 
    str.includes('system/metrics') || 
    str.includes('hardware/status')
  ) {
    // Silently drop the output
    if (callback) callback();
    return true;
  }
  
  // Allow everything else
  return originalStderrWrite.apply(process.stderr, arguments);
};

// Create a custom logger that filters out frequent API requests and error messages
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Skip logging if no arguments
  if (args.length === 0) return originalConsoleLog.apply(console, []);
  
  // Check if it's a string message
  if (typeof args[0] === 'string') {
    const message = args[0];
    
    // Super aggressive filtering - block ALL API-related logs
    if (
      // Block any mention of API endpoints
      message.includes('/api/') ||
      // Block any system metrics mentions
      message.includes('system/metrics') ||
      // Block any hardware status mentions
      message.includes('hardware/status') ||
      // Block any network status mentions
      message.includes('network/status') ||
      // Block any mention of ms timing in GET requests
      (message.includes('GET') && message.includes('ms'))
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
