// Optimized script for starting Next.js on Raspberry Pi with limited memory
// Usage: node start-pi.js

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configure environment variables
const env = { 
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=384', // Very conservative memory limit
  PORT: '3001' // Use port 3001 as per user preference
};

// First clean up any previous build artifacts
console.log('🧹 Cleaning up previous build artifacts...');
try {
  if (fs.existsSync('./.next')) {
    console.log('Removing .next directory...');
    fs.rmSync('./.next', { recursive: true, force: true });
  }
} catch (err) {
  console.error('Error during cleanup:', err);
}

// Run Next.js in development mode (faster than build+start for testing)
console.log('🚀 Starting Next.js in development mode on port 3001...');
console.log('🧠 Using reduced memory allocation (384MB) for Node.js');

const nextDev = spawn('pnpm', ['next', 'dev'], { 
  env, 
  stdio: 'inherit'
});

nextDev.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
});

process.on('SIGINT', () => {
  console.log('Stopping Next.js...');
  nextDev.kill('SIGINT');
  process.exit(0);
});
