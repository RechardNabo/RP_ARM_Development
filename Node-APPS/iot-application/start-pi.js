// Optimized script for starting Next.js on Raspberry Pi with limited memory
// Usage: node start-pi.js [--build]

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configure environment variables
const env = { 
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=384', // Conservative memory limit
  PORT: '3001' // Use port 3001 as per user preference
};

// Check if build flag is present
const shouldBuild = process.argv.includes('--build');

// Check if we should start in development mode
const devMode = process.argv.includes('--dev');

// Function to run a command and return a promise
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { env, stdio: 'inherit' });
    
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
    
    proc.on('error', (err) => reject(err));
  });
}

// Main function
async function main() {
  console.log('🧠 Using reduced memory allocation (384MB) for Node.js');
  
  // Build the application if requested
  if (shouldBuild) {
    console.log('🏗️ Building Next.js application...');
    try {
      await runCommand('npm', ['run', 'build']);
      console.log('✅ Build completed successfully!');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }
  
  // Check if .next directory exists
  if (!fs.existsSync('./.next')) {
    console.error('❌ No production build found. Please run with --build flag first or pull the build from Git.');
    process.exit(1);
  }
  
  // Start the application
  console.log(`🚀 Starting Next.js in ${devMode ? 'development' : 'production'} mode on port 3001...`);
  
  const nextProc = spawn('npm', ['run', devMode ? 'dev' : 'start', '--', '-p', '3001'], { 
    env, 
    stdio: 'inherit'
  });

  nextProc.on('error', (err) => {
    console.error('Failed to start Next.js:', err);
  });

  process.on('SIGINT', () => {
    console.log('Stopping Next.js...');
    nextProc.kill('SIGINT');
    process.exit(0);
  });
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
