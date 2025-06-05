import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { getHardwareManager } from '@/lib/hardware/hardware-manager';

// Helper function to safely execute shell commands
async function safeExec(command: string, defaultValue: any = null) {
  try {
    const execPromise = promisify(exec);
    const { stdout } = await execPromise(command);
    return stdout.trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`, error);
    return defaultValue;
  }
}

export async function GET() {
  try {
    // Initialize hardware manager
    const hardwareManager = getHardwareManager();
    const hwStatus = await hardwareManager.getStatus();
    
    // Get CPU usage
    const cpuInfoStr = await safeExec("top -bn1 | grep '%Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'")
    const cpuUsage = cpuInfoStr ? parseFloat(cpuInfoStr) : 0;
    
    // Get memory usage
    const memInfoStr = await safeExec("free -m | grep Mem");
    let usedMemGB = '0';
    let totalMemGB = '0';
    let memPercent = 0;
    
    if (memInfoStr) {
      const memParts = memInfoStr.split(/\s+/);
      if (memParts.length >= 7) {
        const totalMem = parseInt(memParts[1]) || 0;
        const usedMem = totalMem - (parseInt(memParts[6]) || 0); 
        usedMemGB = (usedMem / 1024).toFixed(1);
        totalMemGB = (totalMem / 1024).toFixed(1);
        memPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;
      }
    }
    
    // Get storage usage
    const diskInfoStr = await safeExec("df -h / | awk 'NR==2{print $3, $2, $5}'");
    let usedStorage = '0';
    let totalStorage = '0';
    let percentStorage = 0;
    
    if (diskInfoStr) {
      const diskParts = diskInfoStr.split(/\s+/);
      if (diskParts.length >= 3) {
        usedStorage = diskParts[0] || '0';
        totalStorage = diskParts[1] || '0';
        const percentStr = diskParts[2] || '0%';
        percentStorage = parseInt(percentStr.replace('%', '')) || 0;
      }
    }
    
    // Get CPU temperature
    const tempInfoStr = await safeExec("cat /sys/class/thermal/thermal_zone0/temp");
    const tempC = tempInfoStr ? (parseInt(tempInfoStr) / 1000) : 0;
    
    // Get uptime
    const uptimeInfoStr = await safeExec("uptime -p", "up 0 minutes");
    const uptime = uptimeInfoStr.replace('up ', '');
    
    // Get hardware model name
    const modelName = await safeExec("cat /proc/device-tree/model || echo 'Raspberry Pi'", "Raspberry Pi");

    return NextResponse.json({
      cpuUsage,
      memory: {
        used: usedMemGB,
        total: totalMemGB,
        percent: memPercent
      },
      storage: {
        used: usedStorage,
        total: totalStorage,
        percent: percentStorage
      },
      temperature: tempC,
      uptime,
      modelName,
      hardware: hwStatus || {}
    });
  } catch (error) {
    console.error("Error fetching hardware stats:", error);
    // Return fallback values in case of error
    return NextResponse.json({
      cpuUsage: 0,
      memory: {
        used: '0',
        total: '0',
        percent: 0
      },
      storage: {
        used: '0',
        total: '0',
        percent: 0
      },
      temperature: 0,
      uptime: '0 minutes',
      modelName: 'Raspberry Pi',
      hardware: {},
      error: 'Failed to fetch hardware stats'
    });
  }
}
