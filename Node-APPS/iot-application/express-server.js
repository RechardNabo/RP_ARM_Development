// Simple Express server to serve Next.js production build without using Next.js server
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Serve static files from the .next directory
app.use('/_next', express.static(path.join(__dirname, '.next')));
app.use('/static', express.static(path.join(__dirname, 'public')));

// Map of routes to their corresponding HTML files
const ROUTES = {
  '/': 'index.html'
};

// Get HTML content from .next/server/pages
function getPageContent(pagePath) {
  try {
    // Try to load the HTML directly from server/pages directory
    const htmlPath = path.join(__dirname, '.next/server/pages', pagePath);
    
    if (fs.existsSync(htmlPath)) {
      return fs.readFileSync(htmlPath, 'utf8');
    }
    
    // If not found, check if there's a corresponding JS file we can load
    const jsPath = htmlPath.replace('.html', '.js');
    if (fs.existsSync(jsPath)) {
      // Return a basic HTML that loads the client JS bundle
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>IoT Application</title>
            <script src="/_next/static/chunks/main.js" defer></script>
            <script src="/_next/static/chunks/webpack.js" defer></script>
            <script src="/_next/static/chunks/pages${pagePath.replace('.html', '.js')}" defer></script>
          </head>
          <body>
            <div id="__next"></div>
          </body>
        </html>
      `;
    }
    
    // If no HTML or JS found, return a 404
    return null;
  } catch (error) {
    console.error('Error loading page:', error);
    return null;
  }
}

// Set up routes
Object.keys(ROUTES).forEach(route => {
  app.get(route, (req, res) => {
    const content = getPageContent(ROUTES[route]);
    if (content) {
      res.send(content);
    } else {
      res.status(404).send('Page not found');
    }
  });
});

// Handle all other routes - try to load the page or return 404
app.get('*', (req, res) => {
  let path = req.path;
  if (!path.endsWith('.html')) path += '.html';
  
  const content = getPageContent(path.slice(1)); // Remove leading slash
  if (content) {
    res.send(content);
  } else {
    // Try to load 404 page
    const notFoundContent = getPageContent('404.html') || 'Page not found';
    res.status(404).send(notFoundContent);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Network access: http://<your-pi-ip>:${PORT}`);
});
