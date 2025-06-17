const { createServer } = require('http');
const next = require('next');

// Configuration
const port = process.env.PORT || 3001;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Memory optimization for Raspberry Pi
process.env.NODE_OPTIONS = '--max-old-space-size=248';

app.prepare().then(() => {
  createServer((req, res) => {
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
