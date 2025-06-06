import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execPromise = promisify(exec);

// Function to run shell commands with error handling
async function runCommand(command: string): Promise<string> {
  try {
    const { stdout } = await execPromise(command);
    return stdout.trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`, error);
    return '';
  }
}

// Convert uptime in seconds to human-readable format
function formatUptime(uptimeInSeconds: number): string {
  const days = Math.floor(uptimeInSeconds / (24 * 60 * 60));
  const hours = Math.floor((uptimeInSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptimeInSeconds % (60 * 60)) / 60);
  
  return `${days}d ${hours}h ${minutes}m`;
}

// Calculate system metrics for Raspberry Pi
async function getSystemMetrics() {
  // Get CPU usage
  const loadAvg = await runCommand('cat /proc/loadavg');
  const cpuInfoRaw = await runCommand('grep "processor" /proc/cpuinfo | wc -l');
  const numCores = parseInt(cpuInfoRaw) || 4; // Default to 4 if parsing fails
  const loadAvgValue = parseFloat(loadAvg.split(' ')[0]);
  const cpuUsage = (loadAvgValue / numCores) * 100;

  // Get memory info
  const memInfo = await runCommand('cat /proc/meminfo');
  const memTotal = parseInt(memInfo.match(/MemTotal:\s+(\d+)/)?.[1] || '0') / 1024; // Convert to MB
  const memFree = parseInt(memInfo.match(/MemFree:\s+(\d+)/)?.[1] || '0') / 1024;
  const memBuffers = parseInt(memInfo.match(/Buffers:\s+(\d+)/)?.[1] || '0') / 1024;
  const memCached = parseInt(memInfo.match(/Cached:\s+(\d+)/)?.[1] || '0') / 1024;
  const memUsed = memTotal - memFree - memBuffers - memCached;

  // Get storage info
  const dfOutput = await runCommand('df -k / | tail -1');
  const dfParts = dfOutput.split(/\s+/);
  const storageTotal = parseInt(dfParts[1] || '0') / 1024 / 1024; // Convert to GB
  const storageUsed = parseInt(dfParts[2] || '0') / 1024 / 1024;

  // Get CPU temperature - specific to Raspberry Pi
  let temperature = 0;
  try {
    // On Raspberry Pi, temperature is available at this location
    if (fs.existsSync('/sys/class/thermal/thermal_zone0/temp')) {
      const tempRaw = await runCommand('cat /sys/class/thermal/thermal_zone0/temp');
      temperature = parseInt(tempRaw) / 1000; // Convert to Celsius
    } else {
      // Alternative method using vcgencmd (Raspberry Pi specific)
      const tempOutput = await runCommand('vcgencmd measure_temp');
      const tempMatch = tempOutput.match(/temp=(\d+\.\d+)/);
      if (tempMatch) {
        temperature = parseFloat(tempMatch[1]);
      }
    }
  } catch (error) {
    console.error('Error getting temperature:', error);
  }

  // Get system uptime
  const uptimeSeconds = await runCommand('cat /proc/uptime');
  const uptime = formatUptime(parseFloat(uptimeSeconds.split(' ')[0]));

  // Determine system status based on metrics
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (cpuUsage > 80 || memUsed / memTotal > 0.9 || temperature > 80) {
    status = 'critical';
  } else if (cpuUsage > 60 || memUsed / memTotal > 0.7 || temperature > 65) {
    status = 'warning';
  }

  return {
    cpuUsage: parseFloat(cpuUsage.toFixed(1)),
    memoryUsed: parseFloat(memUsed.toFixed(1)),
    memoryTotal: parseFloat(memTotal.toFixed(1)),
    storageUsed: parseFloat(storageUsed.toFixed(1)),
    storageTotal: parseFloat(storageTotal.toFixed(1)),
    temperature: parseFloat(temperature.toFixed(1)),
    uptime,
    status,
  };
}

export async function GET(req: NextRequest) {
  try {
    const metrics = await getSystemMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error in system metrics API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' },
      { status: 500 }
    );
  }
}
