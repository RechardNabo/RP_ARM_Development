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

    // Get detailed service status info
    const serviceStatus = {
      can: hwStatus?.can ? {
        initialized: hwStatus.can.initialized,
        stats: hwStatus.can.stats || {}
      } : { initialized: false, stats: {} },
      wifi: hwStatus?.wifi ? {
        initialized: hwStatus.wifi.initialized,
        status: hwStatus.wifi.status || {}
      } : { initialized: false, status: {} },
      database: {
        mongodb: hwStatus?.mongodb?.connected || false,
        influxdb: hwStatus?.influxdb?.connected || false
      },
      services: {
        grafana: hwStatus?.grafana?.connected || false
      }
    };
    
    // Try to get running system services
    const systemServicesStr = await safeExec("systemctl list-units --type=service --state=running --no-pager | grep -v inactive | head -10 | awk '{print $1, $3, $4}'");
    const systemServices = systemServicesStr ? 
      systemServicesStr.split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => {
          const parts = line.split(/\s+/);
          return {
            name: parts[0] || '',
            status: parts.length > 1 ? parts[1] : 'unknown',
            description: parts.slice(2).join(' ') || ''
          };
        }) : [];
    
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
      hardware: hwStatus || {},
      services: serviceStatus,
      systemServices
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
      services: {
        can: { initialized: false, stats: {} },
        wifi: { initialized: false, status: {} },
        database: { mongodb: false, influxdb: false },
        services: { grafana: false }
      },
      systemServices: [],
      error: 'Failed to fetch hardware stats'
    });
  }
}
