// start-pi-prod.js - Optimized production script for Raspberry Pi
const { spawn } = require('child_process');

console.log('🚀 Starting Next.js in production mode on port 3001...');
console.log('🧠 Using reduced memory allocation (256MB) for Node.js');

// Configure environment with low memory settings
const env = { 
  ...process.env,
  NODE_ENV: 'production',
  NODE_OPTIONS: '--max-old-space-size=256',
  PORT: '3001'
};

// Start Next.js directly in production mode
const nextStart = spawn('npx', ['next', 'start', '-p', '3001'], { 
  env, 
  stdio: 'inherit'
});

nextStart.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Stopping Next.js...');
  nextStart.kill('SIGINT');
  process.exit(0);
});
