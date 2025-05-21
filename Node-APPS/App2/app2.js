const http = require('http');

const hostname = '192.168.18.9'; // Listen on all interfaces
const port = 302;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World! This is a Node.js app2 running on port 300.\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
