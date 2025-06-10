// Ultra-simple HTTP server for Raspberry Pi to serve static files
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 3001;

// Create a simple HTML page with a message
const simpleHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IoT Application</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { color: #333; }
    .container { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
    .success { color: green; }
  </style>
</head>
<body>
  <div class="container">
    <h1>IoT Application Server</h1>
    <p class="success">Server is running successfully on port ${PORT}!</p>
    <p>This is a static server placeholder while we address Next.js middleware issues.</p>
    <p>Current time: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
`;

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Handle favicon requests to prevent console errors
  if (req.url === '/favicon.ico') {
    res.writeHead(204); // No content
    res.end();
    return;
  }
  
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // For now, just return a simple HTML page for all requests
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(simpleHtml);
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Access from other devices using your Raspberry Pi's IP address on port ${PORT}`);
});

