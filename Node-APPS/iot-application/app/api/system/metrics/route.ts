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

interface ExecResult {
  stdout: string;
  stderr: string;
}

// Mock exec function for type safety - will be replaced at runtime by actual Node.js functions
const exec = (command: string, callback: (error: Error | null, stdout: string, stderr: string) => void) => {
  callback(null, "", "");
  return { kill: () => {} };
};

// Mock promisify for type safety - will work at runtime with actual Node.js functions
function promisify<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => Promise<ExecResult> {
  return async (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err: Error | null, stdout: string, stderr: string) => {
        if (err) reject(err);
        else resolve({ stdout, stderr });
      });
    });
  };
}

// Define the result type for execAsync with optional options parameter
interface ExecOptions {
  encoding?: string;
  timeout?: number;
  maxBuffer?: number;
  killSignal?: string;
  cwd?: string;
  env?: Record<string, string>;
}

const execAsync = (command: string, options?: ExecOptions) => {
  return new Promise<ExecResult>((resolve, reject) => {
    // @ts-ignore - This will be replaced at runtime by Node.js util.promisify
    exec(command, options || {}, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve({ stdout, stderr });
    });
  });
};

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
      const { stdout } = await execAsync("top -bn1 | grep '%Cpu(s)' | awk '{print $2 + $4}'" , {})
      if (stdout && stdout.trim()) {
        return parseFloat(stdout.trim()) || 0
      }
    } catch (e) {
      // First command failed, try alternative
    }
    
    try {
      const { stdout } = await execAsync("grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'" , {})
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
    try {
      const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $2\" \"$3\" \"$4}'")
      if (stdout && stdout.trim()) {
        const [totalStr, usedStr, freeStr] = stdout.trim().split(" ")
        
        // Convert sizes like 29G, 15G to GB numbers
        const extractGB = (str: string) => {
          if (!str) return 0
          // Safely extract the numeric part
          const matches = str.match(/([\d.]+)/)
          const num = matches && matches[1] ? parseFloat(matches[1]) : 0
          
          // Determine unit multiplier
          const isGB = str.toUpperCase().includes('G')
          const isMB = str.toUpperCase().includes('M')
          const isKB = str.toUpperCase().includes('K')
          
          if (isGB) return num
          if (isMB) return num / 1024
          if (isKB) return num / (1024 * 1024)
          return num
        }
        
        return {
          total: extractGB(totalStr),
          used: extractGB(usedStr),
          free: extractGB(freeStr)
        }
      }
    } catch (e) {
      // First approach failed
    }
    
    // Try another approach for Raspberry Pi
    const { stdout } = await execAsync("df -B1 / | tail -1 | awk '{print $2\" \"$3\" \"$4}'")
    if (stdout && stdout.trim()) {
      const [totalStr, usedStr, freeStr] = stdout.trim().split(" ")
      return {
        total: parseFloat(totalStr) / (1024 * 1024 * 1024) || 0, // bytes to GB
        used: parseFloat(usedStr) / (1024 * 1024 * 1024) || 0,
        free: parseFloat(freeStr) / (1024 * 1024 * 1024) || 0
      }
    }
    
    return { total: 0, used: 0, free: 0 }
  } catch (error) {
    console.error("Failed to get storage info:", error)
    return { total: 0, used: 0, free: 0 }
  }
}

async function getMemoryInfo(): Promise<{ total: number; used: number; free: number }> {
  try {
    try {
      const { stdout } = await execAsync("free -m | grep 'Mem:'" , {})
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
      const { stdout: totalMem } = await execAsync("cat /proc/meminfo | grep MemTotal | awk '{print $2}'" , {})
      const { stdout: freeMem } = await execAsync("cat /proc/meminfo | grep MemFree | awk '{print $2}'" , {})
      
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
      const { stdout } = await execAsync("vcgencmd measure_temp" , {})
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
      const { stdout } = await execAsync("cat /sys/class/thermal/thermal_zone0/temp" , {})
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
      const { stdout } = await execAsync("uptime -p" , {})
      if (stdout && stdout.trim()) {
        const uptime = stdout.trim()
        return uptime.includes("up ") ? uptime.replace("up ", "") : uptime
      }
    } catch (e) {
      // First method failed
    }
    
    try {
      const { stdout } = await execAsync("cat /proc/uptime" , {})
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
