import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { getHardwareManager } from '@/lib/hardware/hardware-manager';

export async function GET() {
  try {
    // Initialize hardware manager
    const hardwareManager = getHardwareManager();
    const hwStatus = await hardwareManager.getStatus();
    
    // Create promisified exec
    const execPromise = promisify(exec);
    
    // Get CPU usage
    const cpuInfoCmd = await execPromise("top -bn1 | grep '%Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'");
    const cpuUsage = parseFloat(cpuInfoCmd.stdout.trim());
    
    // Get memory usage
    const memInfoCmd = await execPromise("free -m | grep Mem");
    const memParts = memInfoCmd.stdout.trim().split(/\\s+/);
    const totalMem = parseInt(memParts[1]);
    const usedMem = totalMem - parseInt(memParts[6]); // Free memory
    const usedMemGB = (usedMem / 1024).toFixed(1);
    const totalMemGB = (totalMem / 1024).toFixed(1);
    const memPercent = Math.round((usedMem / totalMem) * 100);
    
    // Get storage usage
    const diskInfoCmd = await execPromise("df -h / | awk 'NR==2{print $3, $2, $5}'");
    const [usedStorage, totalStorage, percentStorageStr] = diskInfoCmd.stdout.trim().split(/\\s+/);
    const percentStorage = parseInt(percentStorageStr.replace('%', ''));
    
    // Get CPU temperature
    const tempInfoCmd = await execPromise("cat /sys/class/thermal/thermal_zone0/temp");
    const tempC = parseInt(tempInfoCmd.stdout.trim()) / 1000;
    
    // Get uptime
    const uptimeInfoCmd = await execPromise("uptime -p");
    const uptime = uptimeInfoCmd.stdout.trim().replace('up ', '');
    
    // Get hardware model name
    const modelInfoCmd = await execPromise("cat /proc/device-tree/model || echo 'Raspberry Pi'");
    const modelName = modelInfoCmd.stdout.trim();

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
      hardware: hwStatus
    });
  } catch (error) {
    console.error("Error fetching hardware stats:", error);
    return NextResponse.json({ error: "Failed to fetch hardware stats" }, { status: 500 });
  }
}
