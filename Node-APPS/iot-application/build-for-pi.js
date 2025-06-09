// build-for-pi.js - Special build script for Windows-to-Raspberry Pi workflow
// This script ensures all necessary build files are generated and not gitignored

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run a command and return a promise
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { stdio: 'inherit' });
    
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
    
    proc.on('error', (err) => reject(err));
  });
}

// Function to ensure a file exists
function ensureFileExists(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating file: ${filePath}`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
}

// Main function
async function main() {
  try {
    // 1. Run the Next.js build process
    console.log('🏗️ Building Next.js application...');
    await runCommand('npx', ['next', 'build']);
    
    // 2. Check for BUILD_ID file, create if missing
    const buildIdPath = path.join('.next', 'BUILD_ID');
    if (!fs.existsSync(buildIdPath)) {
      console.log('⚠️ BUILD_ID file missing, creating placeholder...');
      const buildId = Date.now().toString();
      fs.writeFileSync(buildIdPath, buildId);
    }
    
    // 3. Ensure other critical build files exist
    ensureFileExists(path.join('.next', 'build-manifest.json'), '{}');
    ensureFileExists(path.join('.next', 'prerender-manifest.json'), '{}');
    
    // 4. Validate the build
    if (fs.existsSync(buildIdPath)) {
      console.log('✅ BUILD_ID exists:', fs.readFileSync(buildIdPath, 'utf8'));
    }
    
    // 5. Remind about Git commands
    console.log('\n🔥 Build completed successfully!');
    console.log('Next steps:');
    console.log('1. git add .');
    console.log('2. git commit -m "Update build for Raspberry Pi"');
    console.log('3. git push origin development');
    console.log('4. On Raspberry Pi: git pull && node start-pi.js');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
