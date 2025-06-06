#!/bin/bash

# Raspberry Pi deployment script for Next.js IoT Application
# This script handles common Raspberry Pi deployment issues

echo "=== Starting Raspberry Pi deployment ==="

# Step 1: Clean up any corrupted npm cache
echo "Cleaning npm cache..."
rm -rf ~/.npm
mkdir -p ~/.npm
chmod 777 ~/.npm

# Step 2: Update project and dependencies
echo "Updating project from git..."
git pull origin development

echo "Installing dependencies..."
# Remove node_modules completely
rm -rf node_modules

# Use a fresh install with force flag and reduced memory usage
NODE_OPTIONS=--max_old_space_size=512 npm install --force --legacy-peer-deps

# Step 3: Build the application
echo "Building application..."
# Use production mode and limited memory
NODE_ENV=production NODE_OPTIONS=--max_old_space_size=512 npm run build

# Step 4: Start the application
echo "Starting application on port 3001..."
PORT=3001 NODE_ENV=production npm run start

echo "=== Deployment complete ==="
