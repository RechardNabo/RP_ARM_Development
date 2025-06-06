import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CirclePower, Cpu, Thermometer, MemoryStickIcon as Memory, HardDrive } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import axios from "axios"
import { cn } from "@/lib/utils"

interface SystemMetrics {
  cpuUsage: number
  memoryUsed: number
  memoryTotal: number
  storageUsed: number
  storageTotal: number
  temperature: number
  uptime: string
  status: "healthy" | "warning" | "critical"
}

export function SystemStatus() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    storageUsed: 0, 
    storageTotal: 0,
    temperature: 0,
    uptime: "",
    status: "healthy"
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Function to fetch hardware metrics
    const fetchSystemMetrics = async () => {
      try {
        // Call the API endpoint that will read system metrics
        const response = await axios.get('/api/system/metrics')
        setMetrics(response.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching system metrics:', err)
        setError('Failed to fetch system metrics')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchSystemMetrics()

    // Set up interval to fetch metrics every 500ms
    const intervalId = setInterval(fetchSystemMetrics, 500)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  // Calculate percentages for progress bars
  const memoryPercentage = metrics.memoryTotal > 0 ? (metrics.memoryUsed / metrics.memoryTotal) * 100 : 0
  const storagePercentage = metrics.storageTotal > 0 ? (metrics.storageUsed / metrics.storageTotal) * 100 : 0
  const tempPercentage = (metrics.temperature / 100) * 100 // Assuming 100°C as max temperature

  // Format memory and storage values
  const formatSize = (size: number): string => {
    if (size < 1024) return `${size.toFixed(1)} MB`
    return `${(size / 1024).toFixed(1)} GB`
  }

  // Get badge status color
  const getBadgeColor = () => {
    switch (metrics.status) {
      case "warning":
        return "bg-yellow-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-green-500"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>System Status</CardTitle>
          <div>
            {loading ? (
              <Badge>Loading...</Badge>
            ) : error ? (
              <Badge>Error</Badge>
            ) : (
              <Badge>
                {metrics.status === "healthy" ? "Healthy" : metrics.status === "warning" ? "Warning" : "Critical"}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>CM4-IO-WIRELESS-BASE with Raspberry Pi CM4</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm">{loading ? "--" : `${metrics.cpuUsage.toFixed(1)}%`}</span>
            </div>
            <Progress value={loading ? 0 : metrics.cpuUsage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Memory className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <span className="text-sm">
                {loading ? "--" : `${formatSize(metrics.memoryUsed)} / ${formatSize(metrics.memoryTotal)}`}
              </span>
            </div>
            <Progress value={loading ? 0 : memoryPercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <span className="text-sm">
                {loading ? "--" : `${formatSize(metrics.storageUsed)} / ${formatSize(metrics.storageTotal)}`}
              </span>
            </div>
            <Progress value={loading ? 0 : storagePercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <span className="text-sm">{loading ? "--" : `${metrics.temperature.toFixed(1)}°C`}</span>
            </div>
            <Progress value={loading ? 0 : tempPercentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <CirclePower className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <span className="text-sm">{loading ? "--" : metrics.uptime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
