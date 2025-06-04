import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface SystemMetrics {
  cpu: {
    usage: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
  };
  temperature: {
    cpu: number;
  };
  uptime: {
    days: number;
    hours: number;
    minutes: number;
  };
}

export async function GET() {
  try {
    // Get CPU usage
    const cpuUsage = await getCpuUsage();
    
    // Get memory information
    const memInfo = await getMemoryInfo();
    
    // Get storage information
    const storageInfo = await getStorageInfo();
    
    // Get CPU temperature
    const temperature = await getCpuTemperature();
    
    // Get system uptime
    const uptime = await getSystemUptime();
    
    return NextResponse.json({
      success: true,
      metrics: {
        cpu: {
          usage: cpuUsage,
        },
        memory: {
          total: memInfo.total,
          used: memInfo.used,
          free: memInfo.free,
        },
        storage: {
          total: storageInfo.total,
          used: storageInfo.used,
          free: storageInfo.free,
        },
        temperature: {
          cpu: temperature,
        },
        uptime: uptime,
      } as SystemMetrics,
    });
  } catch (error) {
    console.error("Error fetching system metrics:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch system metrics",
    }, { status: 500 });
  }
}

async function getCpuUsage(): Promise<number> {
  try {
    // Use top command to get CPU usage
    const { stdout } = await execAsync("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'");
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error("Error getting CPU usage:", error);
    return 0;
  }
}

async function getMemoryInfo(): Promise<{ total: number; used: number; free: number }> {
  try {
    // Get memory information from /proc/meminfo
    const { stdout } = await execAsync("free -m | grep Mem");
    const parts = stdout.trim().split(/\s+/);
    
    // Values are in MB
    const total = parseInt(parts[1], 10);
    const used = parseInt(parts[2], 10);
    const free = parseInt(parts[3], 10);
    
    return { total, used, free };
  } catch (error) {
    console.error("Error getting memory info:", error);
    return { total: 0, used: 0, free: 0 };
  }
}

async function getStorageInfo(): Promise<{ total: number; used: number; free: number }> {
  try {
    // Get storage information for the root filesystem
    const { stdout } = await execAsync("df -m / | tail -1");
    const parts = stdout.trim().split(/\s+/);
    
    // Values are in MB
    const total = parseInt(parts[1], 10);
    const used = parseInt(parts[2], 10);
    const free = parseInt(parts[3], 10);
    
    return { total, used, free };
  } catch (error) {
    console.error("Error getting storage info:", error);
    return { total: 0, used: 0, free: 0 };
  }
}

async function getCpuTemperature(): Promise<number> {
  try {
    // Get CPU temperature from vcgencmd (Raspberry Pi specific)
    const { stdout } = await execAsync("cat /sys/class/thermal/thermal_zone0/temp");
    // Temperature is in millicelsius, convert to celsius
    return parseFloat(stdout.trim()) / 1000;
  } catch (error) {
    console.error("Error getting CPU temperature:", error);
    return 0;
  }
}

async function getSystemUptime(): Promise<{ days: number; hours: number; minutes: number }> {
  try {
    // Get uptime in seconds
    const { stdout } = await execAsync("cat /proc/uptime | awk '{print $1}'");
    const uptimeSeconds = parseFloat(stdout.trim());
    
    // Convert to days, hours, minutes
    const days = Math.floor(uptimeSeconds / (24 * 3600));
    const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    return { days, hours, minutes };
  } catch (error) {
    console.error("Error getting system uptime:", error);
    return { days: 0, hours: 0, minutes: 0 };
  }
}
