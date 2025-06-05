"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Battery, Signal, ThermometerSnowflake, Cpu, Activity } from "lucide-react"
import { useDeviceStore } from "@/lib/device-store"

export function DeviceHealthOverview() {
  const { devices } = useDeviceStore()
  const [healthStats, setHealthStats] = useState({
    overallHealth: 0,
    batteryLevels: 0,
    connectivity: 0,
    temperature: 0,
    cpuUsage: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading health data
    const timer = setTimeout(() => {
      // Calculate health metrics based on devices
      const onlineDevices = devices.filter((d) => d.status === "online").length
      const onlinePercentage = (onlineDevices / devices.length) * 100

      // Get average battery level for devices that have battery info
      const devicesWithBattery = devices.filter((d) => d.battery && d.battery !== "N/A")
      const avgBattery =
        devicesWithBattery.length > 0
          ? devicesWithBattery.reduce((sum, device) => {
              const batteryValue = Number.parseInt(device.battery?.replace("%", "") || "0")
              return sum + batteryValue
            }, 0) / devicesWithBattery.length
          : 0

      // Simulate other health metrics
      setHealthStats({
        overallHealth: Math.min(onlinePercentage, 100),
        batteryLevels: avgBattery,
        connectivity: onlinePercentage,
        temperature: 85, // Simulated good temperature status
        cpuUsage: 65, // Simulated moderate CPU usage
      })

      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [devices])

  const getHealthColor = (value: number) => {
    if (value >= 80) return "text-green-500"
    if (value >= 60) return "text-amber-500"
    return "text-red-500"
  }

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-500"
    if (value >= 60) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Activity className={`h-6 w-6 ${getHealthColor(healthStats.overallHealth)}`} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(healthStats.overallHealth)}%</div>
              <p className="text-xs text-muted-foreground">Overall Health</p>
            </div>
            <Progress
              value={healthStats.overallHealth}
              className="h-2 w-full"
              indicatorClassName={getProgressColor(healthStats.overallHealth)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Battery className={`h-6 w-6 ${getHealthColor(healthStats.batteryLevels)}`} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(healthStats.batteryLevels)}%</div>
              <p className="text-xs text-muted-foreground">Battery Levels</p>
            </div>
            <Progress
              value={healthStats.batteryLevels}
              className="h-2 w-full"
              indicatorClassName={getProgressColor(healthStats.batteryLevels)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Signal className={`h-6 w-6 ${getHealthColor(healthStats.connectivity)}`} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(healthStats.connectivity)}%</div>
              <p className="text-xs text-muted-foreground">Connectivity</p>
            </div>
            <Progress
              value={healthStats.connectivity}
              className="h-2 w-full"
              indicatorClassName={getProgressColor(healthStats.connectivity)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <ThermometerSnowflake className={`h-6 w-6 ${getHealthColor(healthStats.temperature)}`} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(healthStats.temperature)}%</div>
              <p className="text-xs text-muted-foreground">Temperature</p>
            </div>
            <Progress
              value={healthStats.temperature}
              className="h-2 w-full"
              indicatorClassName={getProgressColor(healthStats.temperature)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Cpu className={`h-6 w-6 ${getHealthColor(healthStats.cpuUsage)}`} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(healthStats.cpuUsage)}%</div>
              <p className="text-xs text-muted-foreground">CPU Usage</p>
            </div>
            <Progress
              value={healthStats.cpuUsage}
              className="h-2 w-full"
              indicatorClassName={getProgressColor(healthStats.cpuUsage)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
