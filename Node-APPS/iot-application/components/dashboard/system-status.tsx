"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CirclePower, Cpu, Thermometer, MemoryStickIcon as Memory, HardDrive } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface SystemMetrics {
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

export function SystemStatus() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy')

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/system/metrics')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.metrics)
        
        // Determine system status based on metrics
        if (data.metrics.cpu.usage > 80 || data.metrics.temperature.cpu > 80) {
          setStatus('critical')
        } else if (data.metrics.cpu.usage > 60 || data.metrics.temperature.cpu > 60) {
          setStatus('warning')
        } else {
          setStatus('healthy')
        }
        
        setError(null)
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error fetching system metrics:', err)
      setError('Failed to fetch system metrics')
      setStatus('warning')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Calculate percentages
  const memoryUsagePercent = metrics?.memory?.used && metrics?.memory?.total ? (metrics.memory.used / metrics.memory.total) * 100 : 0
  const storageUsagePercent = metrics?.storage?.used && metrics?.storage?.total ? (metrics.storage.used / metrics.storage.total) * 100 : 0
  
  // Format values for display
  const formatGB = (mb: number) => (mb / 1024).toFixed(1)
  const formatUptime = (days: number, hours: number, minutes: number) => 
    `${days}d ${hours}h ${minutes}m`

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>System Status</CardTitle>
          <Badge className={
            status === 'healthy' ? 'bg-green-500' : 
            status === 'warning' ? 'bg-amber-500' : 
            'bg-red-500'
          }>
            {status === 'healthy' ? 'Healthy' : 
             status === 'warning' ? 'Warning' : 
             'Critical'}
          </Badge>
        </div>
        <CardDescription>CM4-IO-WIRELESS-BASE with Raspberry Pi CM4</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !metrics ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 p-4 text-center">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className="text-sm">{metrics?.cpu?.usage?.toFixed(1) ?? '0.0'}%</span>
              </div>
              <Progress value={metrics?.cpu?.usage ?? 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Memory className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Memory</span>
                </div>
                <span className="text-sm">
                  {formatGB(metrics?.memory?.used ?? 0)} GB / {formatGB(metrics?.memory?.total ?? 0)} GB
                </span>
              </div>
              <Progress value={memoryUsagePercent} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <span className="text-sm">
                  {formatGB(metrics?.storage?.used ?? 0)} GB / {formatGB(metrics?.storage?.total ?? 0)} GB
                </span>
              </div>
              <Progress value={storageUsagePercent} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Temperature</span>
                </div>
                <span className="text-sm">{metrics?.temperature?.cpu?.toFixed(1) ?? '0.0'}°C</span>
              </div>
              <Progress value={metrics?.temperature?.cpu ?? 0} className="h-2" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <CirclePower className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Uptime</span>
              </div>
              <span className="text-sm">
                {metrics?.uptime?.days !== undefined && metrics?.uptime?.hours !== undefined && metrics?.uptime?.minutes !== undefined 
                  ? formatUptime(
                      metrics.uptime.days,
                      metrics.uptime.hours,
                      metrics.uptime.minutes
                    ) 
                  : '0d 0h 0m'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
