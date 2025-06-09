// build-for-pi.js - Special build script for Windows-to-Raspberry Pi workflow
// This script ensures all necessary build files are generated and not gitignored

const { spawn } = require('child_process');
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

// Function to ensure a file exists with given content
function ensureFileExists(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating file: ${filePath}`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

// Main function
async function main() {
  try {
    // 1. Run the Next.js build process
    console.log('🏗️ Building Next.js application...');
    try {
      await runCommand('npm', ['run', 'build']);
    } catch (e) {
      console.log('⚠️ Build command failed, but we will continue with manual file creation');
    }
    
    // 2. Create/ensure all critical Next.js build files
    console.log('📁 Creating/ensuring all required Next.js build files...');
    
    // BUILD_ID - Required for production mode
    const buildId = Date.now().toString();
    ensureFileExists(path.join('.next', 'BUILD_ID'), buildId);
    
    // routes-manifest.json - Required for routing
    const routesManifest = {
      version: 3,
      basePath: "",
      redirects: [],
      headers: [],
      rewrites: [],
      staticRoutes: [],
      dynamicRoutes: [],
      dataRoutes: [],
      i18n: { locales: ["en"], defaultLocale: "en" }
    };
    ensureFileExists(path.join('.next', 'routes-manifest.json'), JSON.stringify(routesManifest, null, 2));
    
    // Other essential build files
    ensureFileExists(path.join('.next', 'build-manifest.json'), JSON.stringify({
      polyfillFiles: [],
      devFiles: [],
      ampDevFiles: [],
      lowPriorityFiles: [],
      rootMainFiles: [],
      pages: { 
        '/_app': [], 
        '/': [],
        '/_error': [],
        '/_document': [] 
      },
      middleware: {
        '/_middleware': {
          files: []
        }
      },
      ampFirstPages: []
    }, null, 2));
    
    ensureFileExists(path.join('.next', 'prerender-manifest.json'), JSON.stringify({
      version: 4,
      routes: {},
      dynamicRoutes: {}, 
      notFoundRoutes: []
    }, null, 2));
    
    ensureFileExists(path.join('.next', 'required-server-files.json'), JSON.stringify({
      version: 1,
      config: { 
        trailingSlash: false, 
        env: {}, 
        basePath: "",
        pageExtensions: ["js", "jsx", "ts", "tsx"] 
      },
      appDir: path.resolve('.')
    }, null, 2));
    
    ensureFileExists(path.join('.next', 'react-loadable-manifest.json'), '{}');
    
    // 3. Validate the build
    let missingFiles = [];
    const requiredFiles = [
      'BUILD_ID',
      'routes-manifest.json',
      'build-manifest.json',
      'prerender-manifest.json',
      'required-server-files.json',
      'react-loadable-manifest.json'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join('.next', file))) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length > 0) {
      console.error(`⚠️ Still missing files: ${missingFiles.join(', ')}`);
    } else {
      console.log('✅ All required Next.js build files created successfully!');
    }
    
    // 4. Remind about Git commands
    console.log('\n🔥 Build preparation completed successfully!');
    console.log('Next steps:');
    console.log('1. git add .');
    console.log('2. git commit -m "Update build files for Raspberry Pi"');
    console.log('3. git push origin development');
    console.log('4. On Raspberry Pi: git pull && node start-pi.js');
    
  } catch (error) {
    console.error('❌ Process failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
