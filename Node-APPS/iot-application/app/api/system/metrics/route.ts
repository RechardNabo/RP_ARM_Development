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
  // Process will be available at runtime
  const processEnv = typeof process !== "undefined" ? process.env as Record<string, string | undefined> : {};
  
  return (
    processEnv.VERCEL_ENV === "preview" ||
    processEnv.SKIP_MONGODB === "true" ||
    processEnv.NODE_ENV === "development"
  );
}

export interface SystemService {
  name: string
  status: 'active' | 'inactive' | 'failed' | 'activating' | 'unknown'
  description: string
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
  uptime: {
    days: number
    hours: number
    minutes: number
  }
  services: SystemService[]
}

// Mock data for preview mode or errors
function getMockSystemMetrics(): SystemMetrics {
  return {
    cpu: { usage: Math.round(Math.random() * 100) },
    memory: {
      total: 8 * 1024, // 8GB in MB
      used: Math.round(Math.random() * 4 * 1024), // Random up to 4GB
      free: 4 * 1024, // 4GB in MB
    },
    storage: {
      total: 32 * 1024, // 32GB in MB
      used: Math.round(Math.random() * 16 * 1024), // Random up to 16GB
      free: 16 * 1024, // 16GB in MB
    },
    temperature: {
      cpu: Math.round(40 + Math.random() * 20), // Random between 40-60°C
    },
    uptime: {
      days: 3,
      hours: 7,
      minutes: 45
    },
    services: [
      { name: "can0-interface", status: "active", description: "CAN0 Interface Setup" },
      { name: "influxdb", status: "inactive", description: "InfluxDB Time Series Database" },
      { name: "mongod", status: "active", description: "MongoDB Database Server" },
      { name: "grafana-server", status: "active", description: "Grafana Dashboard" },
      { name: "nginx", status: "active", description: "Web Server" },
      { name: "webmin", status: "inactive", description: "Webmin Administration" }
    ]
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
    const cpuMetrics = await getCpuUsage()
    const memoryInfo = await getMemoryInfo()
    const storageInfo = await getStorageInfo()
    const temperatureInfo = await getCpuTemperature()
    const uptimeInfo = await getSystemUptime()
    const servicesInfo = await getSystemServices()
    
    const metrics: SystemMetrics = {
      cpu: {
        usage: cpuMetrics
      },
      memory: memoryInfo,
      storage: storageInfo,
      temperature: {
        cpu: temperatureInfo
      },
      uptime: uptimeInfo,
      services: servicesInfo
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

async function getSystemUptime(): Promise<{ days: number; hours: number; minutes: number }> {
  try {
    let days = 0;
    let hours = 0;
    let minutes = 0;
    
    // Try uptime -p first (prettier output on most systems)
    try {
      const { stdout } = await execAsync("uptime -p")
      if (stdout && stdout.trim()) {
        const uptime = stdout.trim()
        // Parse "up 5 days, 2 hours, 30 minutes" format
        const daysMatch = uptime.match(/([0-9]+)\s+day/)
        const hoursMatch = uptime.match(/([0-9]+)\s+hour/)
        const minutesMatch = uptime.match(/([0-9]+)\s+minute/)
        
        if (daysMatch) days = parseInt(daysMatch[1], 10)
        if (hoursMatch) hours = parseInt(hoursMatch[1], 10)
        if (minutesMatch) minutes = parseInt(minutesMatch[1], 10)
        
        return { days, hours, minutes }
      }
    } catch (e) {
      console.log("uptime -p command failed:", e)
      // First method failed, continue to next
    }
    
    // Try reading from /proc/uptime
    try {
      const { stdout } = await execAsync("cat /proc/uptime")
      if (stdout && stdout.trim()) {
        const uptime = parseFloat(stdout.split(' ')[0])
        days = Math.floor(uptime / 86400)
        hours = Math.floor((uptime % 86400) / 3600)
        minutes = Math.floor((uptime % 3600) / 60)
        return { days, hours, minutes }
      }
    } catch (e) {
      console.log("/proc/uptime approach failed:", e)
      // Second method failed, continue
    }
    
    // Last resort - try using uptime command without -p
    try {
      const { stdout } = await execAsync("uptime")
      if (stdout && stdout.trim()) {
        // The uptime command output varies by system, try to extract values
        // Typical format: "12:34:56 up 1 day, 3:45, 2 users, load average: 0.52, 0.58, 0.59"
        const uptimeStr = stdout.split('up ')[1]?.split(',')?.[0] || ''
        
        if (uptimeStr.includes('day')) {
          const dayParts = uptimeStr.split('day')
          days = parseInt(dayParts[0].trim(), 10) || 0
          
          // Try to get hours/minutes from the remainder
          const timeStr = dayParts[1]?.trim() || ''
          if (timeStr.includes(':')) {
            const [hourStr, minStr] = timeStr.split(':').map((s: string) => s.trim())
            hours = parseInt(hourStr, 10) || 0
            minutes = parseInt(minStr, 10) || 0
          }
        } else if (uptimeStr.includes(':')) {
          // Format without days, just hours:minutes
          const [hourStr, minStr] = uptimeStr.split(':').map((s: string) => s.trim())
          hours = parseInt(hourStr, 10) || 0
          minutes = parseInt(minStr, 10) || 0
        }
        
        return { days, hours, minutes }
      }
    } catch (e) {
      console.log("uptime command failed:", e)
    }
    
    // Default fallback
    return { days: 0, hours: 0, minutes: 0 }
  } catch (error) {
    console.error("Failed to get system uptime:", error)
    return { days: 0, hours: 0, minutes: 0 }
  }
}

async function getSystemServices(): Promise<SystemService[]> {
  if (isPreviewMode()) {
    return getMockSystemMetrics().services || []
  }
  
  try {
    const services: SystemService[] = []
    const serviceNames = [
      'can0-interface',
      'influxdb',
      'mongod',
      'grafana-server',
      'nginx',
      'webmin'
    ]
    
    const serviceDescriptions: Record<string, string> = {
      'can0-interface': 'CAN0 Interface Setup',
      'influxdb': 'InfluxDB Time Series Database',
      'mongod': 'MongoDB Database Server',
      'grafana-server': 'Grafana Dashboard',
      'nginx': 'Web Server',
      'webmin': 'Webmin Administration'
    }
    
    // Check each service status
    for (const serviceName of serviceNames) {
      try {
        const { stdout } = await execAsync(`systemctl is-active ${serviceName}`)
        const status = stdout.trim()
        
        // Map systemctl status outputs to our status types
        let mappedStatus: SystemService['status'] = 'unknown'
        if (status === 'active') {
          mappedStatus = 'active'
        } else if (status === 'inactive') {
          mappedStatus = 'inactive'
        } else if (status === 'failed') {
          mappedStatus = 'failed'
        } else if (status === 'activating') {
          mappedStatus = 'activating'
        }
        
        services.push({
          name: serviceName,
          status: mappedStatus,
          description: serviceDescriptions[serviceName] || serviceName
        })
      } catch (error) {
        // If command fails, assume service is inactive or doesn't exist
        // console.log(`Error checking service ${serviceName}:`, error)
        services.push({
          name: serviceName,
          status: 'unknown',
          description: serviceDescriptions[serviceName] || serviceName
        })
      }
    }
    
    return services
  } catch (error) {
    console.error('Failed to get system services:', error)
    return []
  }
}
