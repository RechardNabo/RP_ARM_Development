import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CirclePower, Cpu, Thermometer, MemoryStickIcon as Memory, HardDrive } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { getHardwareManager } from "@/lib/hardware/hardware-manager"
import { exec } from "child_process"
import { promisify } from "util"

export function SystemStatus() {
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy')
  const [cpuUsage, setCpuUsage] = useState<number>(0)
  const [memoryUsage, setMemoryUsage] = useState<{ used: string, total: string, percent: number }>({ used: '0', total: '0', percent: 0 })
  const [storageUsage, setStorageUsage] = useState<{ used: string, total: string, percent: number }>({ used: '0', total: '0', percent: 0 })
  const [temperature, setTemperature] = useState<number>(0)
  const [uptime, setUptime] = useState<string>('0h 0m')
  const [hardwareStatus, setHardwareStatus] = useState<any>(null)
  
  // Function to execute shell commands
  const executeCommand = async (command: string) => {
    try {
      // In browser environment, use the hardware manager
      if (typeof window !== 'undefined') {
        return null
      }
      // In Node.js environment (server-side), execute the command
      const execPromise = promisify(exec)
      const { stdout } = await execPromise(command)
      return stdout.trim()
    } catch (error) {
      console.error(`Error executing command: ${command}`, error)
      return null
    }
  }

  // Function to get system stats
  const getSystemStats = async () => {
    try {
      // Get hardware status from hardware manager
      const hardwareManager = getHardwareManager()
      const hwStatus = await hardwareManager.getStatus()
      setHardwareStatus(hwStatus)

      // Get CPU usage
      const cpuInfo = await executeCommand("top -bn1 | grep '%Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'")
      setCpuUsage(cpuInfo ? parseFloat(cpuInfo) : 0)

      // Get memory usage
      const memInfo = await executeCommand("free -m | grep Mem")
      if (memInfo) {
        const memParts = memInfo.split(/\s+/)
        const total = parseInt(memParts[1])
        const used = total - parseInt(memParts[6]) // Free memory
        const usedGB = (used / 1024).toFixed(1)
        const totalGB = (total / 1024).toFixed(1)
        const percent = Math.round((used / total) * 100)
        setMemoryUsage({ used: usedGB, total: totalGB, percent })
      }

      // Get storage usage
      const diskInfo = await executeCommand("df -h / | awk 'NR==2{print $3, $2, $5}'")
      if (diskInfo) {
        const [used, total, percentStr] = diskInfo.split(/\s+/)
        const percent = parseInt(percentStr.replace('%', ''))
        setStorageUsage({ used, total, percent })
      }

      // Get CPU temperature
      const tempInfo = await executeCommand("cat /sys/class/thermal/thermal_zone0/temp")
      if (tempInfo) {
        const tempC = parseInt(tempInfo) / 1000
        setTemperature(tempC)
      }

      // Get uptime
      const uptimeInfo = await executeCommand("uptime -p")
      if (uptimeInfo) {
        setUptime(uptimeInfo.replace('up ', ''))
      }

      // Set system health based on metrics
      if (cpuUsage > 90 || memoryUsage.percent > 90 || temperature > 75) {
        setSystemHealth('critical')
      } else if (cpuUsage > 70 || memoryUsage.percent > 80 || temperature > 65) {
        setSystemHealth('warning')
      } else {
        setSystemHealth('healthy')
      }
    } catch (error) {
      console.error('Error getting system stats:', error)
    }
  }

  // Set up refresh interval at 500ms
  useEffect(() => {
    // Initial fetch
    getSystemStats()
    
    // Set up interval
    const intervalId = setInterval(() => {
      getSystemStats()
    }, 500) // 500ms refresh rate as requested
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  // Determine badge color based on system health
  const getBadgeClass = () => {
    switch (systemHealth) {
      case 'critical':
        return 'bg-red-500'
      case 'warning':
        return 'bg-amber-500'
      default:
        return 'bg-green-500'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>System Status</CardTitle>
          <Badge className={getBadgeClass()}>{systemHealth === 'healthy' ? 'Healthy' : systemHealth === 'warning' ? 'Warning' : 'Critical'}</Badge>
        </div>
        <CardDescription>Raspberry Pi {hardwareStatus?.modelName || '3 Model B Rev 1.2'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm">{cpuUsage.toFixed(1)}%</span>
            </div>
            <Progress value={cpuUsage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Memory className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <span className="text-sm">{memoryUsage.used} GB / {memoryUsage.total} GB</span>
            </div>
            <Progress value={memoryUsage.percent} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <span className="text-sm">{storageUsage.used} / {storageUsage.total}</span>
            </div>
            <Progress value={storageUsage.percent} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <span className="text-sm">{temperature.toFixed(1)}°C</span>
            </div>
            <Progress value={temperature} max={100} className="h-2" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <CirclePower className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <span className="text-sm">{uptime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
