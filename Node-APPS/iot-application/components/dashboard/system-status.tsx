"use client" // Mark as client component to enable React hooks

// @ts-ignore - Next.js should resolve these imports at build time on the Raspberry Pi
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CirclePower, Cpu, Thermometer, MemoryStickIcon as Memory, HardDrive, Server } from "lucide-react"
import { Progress } from "@/components/ui/progress"
// @ts-ignore - React is available in Next.js project
import { useState, useEffect } from "react"
import { getSystemMetricsService } from "@/lib/services/system-metrics-service"
import type { SystemMetrics, SystemService } from "@/app/api/system/metrics/route"

export function SystemStatus() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0 },
    memory: { total: 0, used: 0, free: 0 },
    storage: { total: 0, used: 0, free: 0 },
    temperature: { cpu: 0 },
    uptime: { days: 0, hours: 0, minutes: 0 }
  })
  const [status, setStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy')

  useEffect(() => {
    const metricsService = getSystemMetricsService()
    
    // Set up a listener for metrics updates
    const metricsListener = (updatedMetrics: SystemMetrics) => {
      setMetrics(updatedMetrics)
      
      // Determine system status based on metrics
      if (updatedMetrics.cpu.usage > 90 || updatedMetrics.temperature.cpu > 80) {
        setStatus('critical')
      } else if (updatedMetrics.cpu.usage > 70 || updatedMetrics.temperature.cpu > 70) {
        setStatus('warning')
      } else {
        setStatus('healthy')
      }
    }
    
    // Register the listener
    metricsService.addListener(metricsListener)
    
    // Start polling metrics at 500ms interval
    metricsService.startMetricsPolling(500)
    
    // Clean up on unmount
    return () => {
      metricsService.removeListener(metricsListener)
    }
  }, [])
  
  // Calculate memory and storage in GB
  const memoryTotalGB = metrics.memory.total / 1024
  const memoryUsedGB = metrics.memory.used / 1024
  const memoryPercentage = metrics.memory.total > 0 ? (metrics.memory.used / metrics.memory.total) * 100 : 0
  
  const storagePercentage = metrics.storage.total > 0 ? (metrics.storage.used / metrics.storage.total) * 100 : 0
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>System Status</CardTitle>
          <Badge 
            className={status === 'healthy' ? 'bg-green-500' : 
                      status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}
          >
            {status === 'healthy' ? 'Healthy' : 
             status === 'warning' ? 'Warning' : 'Critical'}
          </Badge>
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
              <span className="text-sm">{metrics.cpu.usage.toFixed(1)}%</span>
            </div>
            <Progress value={metrics.cpu.usage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Memory className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <span className="text-sm">
                {memoryUsedGB.toFixed(1)} GB / {memoryTotalGB.toFixed(1)} GB
              </span>
            </div>
            <Progress value={memoryPercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <span className="text-sm">
                {metrics.storage.used.toFixed(1)} GB / {metrics.storage.total.toFixed(1)} GB
              </span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <span className="text-sm">{metrics.temperature.cpu}°C</span>
            </div>
            <Progress 
              value={metrics.temperature.cpu} 
              max={100} 
              className="h-2" 
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <CirclePower className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <span className="text-sm">
              {metrics.uptime.days}d {metrics.uptime.hours}h {metrics.uptime.minutes}m
            </span>
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Server className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">System Services</span>
            </div>
            <div className="space-y-2">
              {metrics.services.map((service: SystemService) => (
                <div key={service.name} className="flex justify-between items-center">
                  <span className="text-xs">{service.description}</span>
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${service.status === 'active' ? 'bg-green-500 text-white' : 
                              service.status === 'inactive' ? 'bg-gray-500 text-white' : 
                              service.status === 'failed' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}
                  >
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
