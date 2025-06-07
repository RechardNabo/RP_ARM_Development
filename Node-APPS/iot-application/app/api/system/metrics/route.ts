// Use explicit types to avoid requiring @types/node package
interface NextRequest {
  url: string;
}

interface NextResponse {
  json: (body: any) => Response;
}

// Updated NextResponse with proper signature matching Next.js API
const NextResponse = {
  json: (body: any, init?: ResponseInit) => new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init
  }),
};

// Import actual Node.js modules when running on the server
let util: any;
let childProcess: any;
let execAsync: any;

// @ts-ignore - process will be available at runtime
if (typeof process !== 'undefined') {
  try {
    // In Node.js environment, use the actual modules
    // These imports will only run on the server, not during build
    // @ts-ignore - require will be available at runtime
    util = require('util');
    // @ts-ignore - require will be available at runtime
    childProcess = require('child_process');
    execAsync = util.promisify(childProcess.exec);
  } catch (error) {
    console.error('Error importing Node.js modules:', error);
  }
}

// Helper function to determine if we're in preview mode
function isPreviewMode(): boolean {
  // @ts-ignore - Process will be available at runtime
  const processEnv = typeof process !== "undefined" ? process.env : {};
  
  return (
    processEnv.VERCEL_ENV === "preview" ||
    processEnv.SKIP_MONGODB === "true" ||
    processEnv.NODE_ENV === "development"
  );
}

export interface SystemMetrics {
  cpu: {
    usage: number // percentage 0-100
  }
  memory: {
    total: number // in MB
    used: number // in MB
    free: number // in MB
  }
  storage: {
    total: number // in GB
    used: number // in GB
    free: number // in GB
  }
  temperature: {
    cpu: number // in °C
  }
  uptime: string // formatted uptime string
}

// Mock data for preview mode or errors
function getMockSystemMetrics(): SystemMetrics {
  return {
    cpu: {
      usage: 23,
    },
    memory: {
      total: 1024,
      used: 310,
      free: 714,
    },
    storage: {
      total: 32,
      used: 12.4,
      free: 19.6,
    },
    temperature: {
      cpu: 42,
    },
    uptime: "3d 14h 22m"
  }
}

export async function GET(request: NextRequest) {
  try {
    // In preview mode, return mock data
    if (isPreviewMode()) {
      // @ts-ignore - This will work at runtime
      return NextResponse.json({
        success: true,
        metrics: getMockSystemMetrics(),
      }, { status: 200 })
    }

    // Get CPU usage
    const cpuUsage = await getCpuUsage()

    // Get memory information
    const memInfo = await getMemoryInfo()

    // Get storage information
    const storageInfo = await getStorageInfo()

    // Get CPU temperature
    const temperature = await getCpuTemperature()

    // Get system uptime
    const uptimeString = await getSystemUptime()

    const metrics: SystemMetrics = {
      cpu: {
        usage: cpuUsage,
      },
      memory: memInfo,
      storage: storageInfo,
      temperature: {
        cpu: temperature,
      },
      uptime: uptimeString,
    }

    // @ts-ignore - This will work at runtime
    return NextResponse.json({
      success: true,
      metrics,
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching system metrics:", error)

    // Return mock data as fallback
    // @ts-ignore - This will work at runtime
    return NextResponse.json({
      success: true,
      metrics: getMockSystemMetrics(),
    }, { status: 200 })
  }
}

async function getCpuUsage(): Promise<number> {
  try {
    // Try several commands since different Linux distros might have different outputs
    try {
      const { stdout } = await execAsync("top -bn1 | grep '%Cpu(s)' | awk '{print $2 + $4}'")
      if (stdout && stdout.trim()) {
        return parseFloat(stdout.trim()) || 0
      }
    } catch (e) {
      // First command failed, try alternative
    }
    
    try {
      const { stdout } = await execAsync("grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'")
      if (stdout && stdout.trim()) {
        return parseFloat(stdout.trim()) || 0
      }
    } catch (e) {
      // Second command failed
    }
    
    return 0
  } catch (error) {
    console.error("Failed to get CPU usage:", error)
    return 0
  }
}

async function getStorageInfo(): Promise<{ total: number; used: number; free: number }> {
  try {
    // Extract GB from strings like "29G", "15.5G", "900M", etc.
    function extractGB(str: string | null | undefined): number {
      if (!str) return 0;
      
      // Safely extract the numeric part
      const matches = str.match(/([\d.]+)/);
      const num = matches && matches[1] ? parseFloat(matches[1]) : 0;
      
      // Determine unit multiplier
      const isGB = str.toUpperCase().includes('G');
      const isMB = str.toUpperCase().includes('M');
      const isKB = str.toUpperCase().includes('K');
      
      if (isGB) return num;
      if (isMB) return num / 1024;
      if (isKB) return num / (1024 * 1024);
      return num;
    }

    // First approach: df -h
    try {
      const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $2\" \"$3\" \"$4}'")
      if (stdout && stdout.trim()) {
        const parts = stdout.trim().split(" ");
        if (parts.length >= 3) {
          return {
            total: extractGB(parts[0]),
            used: extractGB(parts[1]),
            free: extractGB(parts[2])
          };
        }
      }
    } catch (error) {
      // First approach failed, continue to next
      console.log("First df approach failed:", error);
    }
    
    // Second approach: df with bytes
    try {
      const { stdout } = await execAsync("df -B1 / | tail -1 | awk '{print $2\" \"$3\" \"$4}'")
      if (stdout && stdout.trim()) {
        const parts = stdout.trim().split(" ");
        if (parts.length >= 3) {
          const divisor = 1024 * 1024 * 1024; // Convert bytes to GB
          return {
            total: parseInt(parts[0], 10) / divisor || 0,
            used: parseInt(parts[1], 10) / divisor || 0,
            free: parseInt(parts[2], 10) / divisor || 0
          };
        }
      }
    } catch (error) {
      console.log("Second df approach failed:", error);
    }
    
    // If we got here, both approaches failed
    console.log("All storage info approaches failed");
    return { total: 0, used: 0, free: 0 };
  } catch (error) {
    console.error("Failed to get storage info:", error);
    return { total: 0, used: 0, free: 0 };
  }
}

async function getMemoryInfo(): Promise<{ total: number; used: number; free: number }> {
  try {
    try {
      const { stdout } = await execAsync("free -m | grep 'Mem:'")
      if (stdout && stdout.trim()) {
        const parts = stdout.trim().split(/\s+/)
        if (parts.length >= 4) {
          return {
            total: parseInt(parts[1], 10) || 0,
            used: parseInt(parts[2], 10) || 0,
            free: parseInt(parts[3], 10) || 0
          }
        }
      }
    } catch (e) {
      // First approach failed
    }
    
    // Try alternative approach
    try {
      const { stdout: totalMem } = await execAsync("cat /proc/meminfo | grep MemTotal | awk '{print $2}'")
      const { stdout: freeMem } = await execAsync("cat /proc/meminfo | grep MemFree | awk '{print $2}'")
      
      if (totalMem && freeMem) {
        const total = parseInt(totalMem.trim(), 10) / 1024 || 0 // KB to MB
        const free = parseInt(freeMem.trim(), 10) / 1024 || 0
        return {
          total,
          used: total - free,
          free
        }
      }
    } catch (e) {
      // Alternative approach failed
    }
    
    return { total: 0, used: 0, free: 0 }
  } catch (error) {
    console.error("Failed to get memory info:", error)
    return { total: 0, used: 0, free: 0 }
  }
}

async function getCpuTemperature(): Promise<number> {
  try {
    // Try various methods for Raspberry Pi temperature
    try {
      const { stdout } = await execAsync("vcgencmd measure_temp")
      if (stdout && stdout.trim()) {
        // Extract the numeric part using regex
        const match = stdout.match(/([\d.]+)/)
        if (match && match[1]) {
          return parseFloat(match[1]) || 0
        }
      }
    } catch (e) {
      // First method failed, try alternative
    }
    
    try {
      const { stdout } = await execAsync("cat /sys/class/thermal/thermal_zone0/temp")
      if (stdout && stdout.trim()) {
        return Math.round(parseInt(stdout.trim(), 10) / 1000) || 0
      }
    } catch (e) {
      // Second method failed
    }
    
    return 0
  } catch (error) {
    console.error("Failed to get CPU temperature:", error)
    return 0
  }
}

async function getSystemUptime(): Promise<string> {
  try {
    try {
      const { stdout } = await execAsync("uptime -p")
      if (stdout && stdout.trim()) {
        const uptime = stdout.trim()
        return uptime.includes("up ") ? uptime.replace("up ", "") : uptime
      }
    } catch (e) {
      // First method failed
    }
    
    try {
      const { stdout } = await execAsync("cat /proc/uptime")
      if (stdout && stdout.trim()) {
        const uptime = parseFloat(stdout.split(' ')[0])
        const days = Math.floor(uptime / 86400)
        const hours = Math.floor((uptime % 86400) / 3600)
        const minutes = Math.floor((uptime % 3600) / 60)
        return `${days}d ${hours}h ${minutes}m`
      }
    } catch (e) {
      // Second method failed
    }
    
    return "unknown"
  } catch (error) {
    console.error("Failed to get system uptime:", error)
    return "unknown"
  }
}
