"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CirclePower, Cpu, Thermometer, MemoryStickIcon as Memory, HardDrive, Wifi, Database, Server } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import React from "react"

// Fix types by declaring badge props interface
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

interface SystemService {
  name: string;
  status: string;
  description: string;
}

interface ServiceStatus {
  can: { initialized: boolean, stats: any };
  wifi: { initialized: boolean, status: any };
  database: { mongodb: boolean, influxdb: boolean };
  services: { grafana: boolean };
}

export function SystemStatus() {
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy')
  const [cpuUsage, setCpuUsage] = useState<number>(0)
  const [memoryUsage, setMemoryUsage] = useState<{ used: string, total: string, percent: number }>({ used: '0', total: '0', percent: 0 })
  const [storageUsage, setStorageUsage] = useState<{ used: string, total: string, percent: number }>({ used: '0', total: '0', percent: 0 })
  const [temperature, setTemperature] = useState<number>(0)
  const [uptime, setUptime] = useState<string>('0h 0m')
  const [hardwareStatus, setHardwareStatus] = useState<any>(null)
  const [services, setServices] = useState<ServiceStatus>({
    can: { initialized: false, stats: {} },
    wifi: { initialized: false, status: {} },
    database: { mongodb: false, influxdb: false },
    services: { grafana: false }
  })
  const [systemServices, setSystemServices] = useState<SystemService[]>([])
  
  // Function to get system stats via API endpoint
  const getSystemStats = async () => {
    try {
      const response = await fetch('/api/hardware/stats');
      if (!response.ok) {
        throw new Error(`Error fetching hardware stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update state with fetched data
      setCpuUsage(data.cpuUsage);
      setMemoryUsage(data.memory);
      setStorageUsage(data.storage);
      setTemperature(data.temperature);
      setUptime(data.uptime);
      setHardwareStatus({ modelName: data.modelName });
      setServices(data.services || {
        can: { initialized: false, stats: {} },
        wifi: { initialized: false, status: {} },
        database: { mongodb: false, influxdb: false },
        services: { grafana: false }
      });
      setSystemServices(data.systemServices || []);

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
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>System Status</CardTitle>
          <CardDescription>Hardware metrics and health status</CardDescription>
        </div>
        <div className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ml-auto ${systemHealth === 'healthy' ? 'bg-green-500' : systemHealth === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}>
          {systemHealth === 'healthy' ? 'Healthy' : systemHealth === 'warning' ? 'Warning' : 'Critical'}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CPU Usage */}
        <div className="space-y-2">
          <div className="flex items-center">
            <Cpu className="h-4 w-4 mr-2" />
            <span className="font-medium">CPU Usage</span>
            <span className="ml-auto">{cpuUsage.toFixed(1)}%</span>
          </div>
          <Progress value={cpuUsage} className="h-1" />
        </div>
        
        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center">
            <Memory className="h-4 w-4 mr-2" />
            <span className="font-medium">Memory Usage</span>
            <span className="ml-auto">{memoryUsage.used} GB / {memoryUsage.total} GB ({memoryUsage.percent}%)</span>
          </div>
          <Progress value={memoryUsage.percent} className="h-1" />
        </div>
        
        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex items-center">
            <HardDrive className="h-4 w-4 mr-2" />
            <span className="font-medium">Storage</span>
            <span className="ml-auto">{storageUsage.used} / {storageUsage.total} ({storageUsage.percent}%)</span>
          </div>
          <Progress value={storageUsage.percent} className="h-1" />
        </div>
        
        {/* Temperature */}
        <div className="flex items-center">
          <Thermometer className="h-4 w-4 mr-2" />
          <span className="font-medium">Temperature</span>
          <span className="ml-auto">{temperature.toFixed(1)}°C</span>
        </div>
        
        {/* Uptime */}
        <div className="flex items-center">
          <CirclePower className="h-4 w-4 mr-2" />
          <span className="font-medium">Uptime</span>
          <span className="ml-auto">{uptime}</span>
        </div>
        
        {/* Service Status */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">System Services</h3>
          <div className="grid grid-cols-2 gap-2">
            {/* Interface Status */}
            <div className="flex items-center p-2 rounded bg-gray-100 dark:bg-gray-800">
              <Server className="h-4 w-4 mr-2" />
              <span className="font-medium">CAN</span>
              <div className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ml-auto ${services.can.initialized ? "bg-green-500" : "bg-gray-400"}`}>
                {services.can.initialized ? "Online" : "Offline"}
              </div>
            </div>
            
            <div className="flex items-center p-2 rounded bg-gray-100 dark:bg-gray-800">
              <Wifi className="h-4 w-4 mr-2" />
              <span className="font-medium">WiFi</span>
              <div className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ml-auto ${services.wifi.initialized ? "bg-green-500" : "bg-gray-400"}`}>
                {services.wifi.initialized ? "Online" : "Offline"}
              </div>
            </div>
            
            {/* Database Status */}
            <div className="flex items-center p-2 rounded bg-gray-100 dark:bg-gray-800">
              <Database className="h-4 w-4 mr-2" />
              <span className="font-medium">MongoDB</span>
              <div className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ml-auto ${services.database.mongodb ? "bg-green-500" : "bg-gray-400"}`}>
                {services.database.mongodb ? "Connected" : "Disconnected"}
              </div>
            </div>
            
            <div className="flex items-center p-2 rounded bg-gray-100 dark:bg-gray-800">
              <Database className="h-4 w-4 mr-2" />
              <span className="font-medium">InfluxDB</span>
              <div className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ml-auto ${services.database.influxdb ? "bg-green-500" : "bg-gray-400"}`}>
                {services.database.influxdb ? "Connected" : "Disconnected"}
              </div>
            </div>
            
            {/* Other Services */}
            <div className="flex items-center p-2 rounded bg-gray-100 dark:bg-gray-800">
              <Server className="h-4 w-4 mr-2" />
              <span className="font-medium">Grafana</span>
              <div className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ml-auto ${services.services.grafana ? "bg-green-500" : "bg-gray-400"}`}>
                {services.services.grafana ? "Running" : "Stopped"}
              </div>
            </div>
          </div>
          
          {/* System Services List */}
          {systemServices.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Running System Services</h4>
              <div className="text-xs space-y-1 max-h-32 overflow-auto">
                {systemServices.map((service: SystemService, index: number) => (
                  <div key={index} className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-medium">{service.name}</span>
                    <div className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ml-2 ${service.status === "running" ? "bg-green-500" : "bg-gray-400"}`}>
                      {service.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
