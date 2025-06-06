// Direct Server Launcher for Raspberry Pi
// This bypasses Next.js build issues by running a simple Express server

const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

// Create Express app
const app = express();
const PORT = 3001; // Fixed port 3001 as required

// Import system metrics functions from existing API route
// This simulates the functionality of app/api/system/metrics/route.ts
async function getSystemMetrics() {
  const metrics = {
    cpuUsage: 0,
    cpuTemp: 0,
    memoryUsage: 0,
    storageUsage: 0,
    uptime: 0,
    status: 'healthy'
  };

  try {
    // CPU Usage
    const loadavg = fs.readFileSync('/proc/loadavg', 'utf8').split(' ');
    const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
    const cpuCores = (cpuInfo.match(/processor\s+:/g) || []).length;
    metrics.cpuUsage = Math.min(100, Math.round((parseFloat(loadavg[0]) / cpuCores) * 100));

    // Memory
    const memInfo = fs.readFileSync('/proc/meminfo', 'utf8');
    const memTotal = parseInt(memInfo.match(/MemTotal:\s+(\d+)/)[1]);
    const memAvailable = parseInt(memInfo.match(/MemAvailable:\s+(\d+)/)[1]);
    metrics.memoryUsage = Math.round(((memTotal - memAvailable) / memTotal) * 100);

    // Storage
    const dfOutput = await execPromise('df -h / | tail -n 1');
    const dfParts = dfOutput.split(/\s+/);
    metrics.storageUsage = parseInt(dfParts[4].replace('%', ''));

    // CPU Temperature
    try {
      // Try vcgencmd first (Raspberry Pi specific)
      const tempOutput = await execPromise('vcgencmd measure_temp');
      const tempMatch = tempOutput.match(/temp=(\d+\.\d+)/);
      metrics.cpuTemp = tempMatch ? parseFloat(tempMatch[1]) : 0;
    } catch (e) {
      // Fallback to thermal sensors
      try {
        const tempFile = '/sys/class/thermal/thermal_zone0/temp';
        if (fs.existsSync(tempFile)) {
          const temp = parseInt(fs.readFileSync(tempFile, 'utf8')) / 1000;
          metrics.cpuTemp = temp;
        }
      } catch (e) {
        metrics.cpuTemp = 0;
      }
    }

    // System Uptime
    const uptimeSeconds = parseFloat(fs.readFileSync('/proc/uptime', 'utf8').split(' ')[0]);
    metrics.uptime = uptimeSeconds;

    // Determine overall status
    if (metrics.cpuUsage > 90 || metrics.cpuTemp > 80 || metrics.memoryUsage > 90 || metrics.storageUsage > 90) {
      metrics.status = 'critical';
    } else if (metrics.cpuUsage > 70 || metrics.cpuTemp > 70 || metrics.memoryUsage > 70 || metrics.storageUsage > 70) {
      metrics.status = 'warning';
    } else {
      metrics.status = 'healthy';
    }
  } catch (error) {
    console.error('Error getting system metrics:', error);
    metrics.status = 'error';
  }

  return metrics;
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

// API endpoint for system metrics
app.get('/api/system/metrics', async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system metrics', message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Network URL: http://${getLocalIP()}:${PORT}`);
});

// Get local IP address for display
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}
