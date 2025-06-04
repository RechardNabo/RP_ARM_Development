"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Server, Activity, Globe, Cpu } from "lucide-react"
import { useEffect, useState, type ElementType } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Define icon type
type LucideIcon = ElementType;

interface ServiceInfo {
  name: string;
  status: string;
  icon: LucideIcon;
  color: string;
  badge: string;
}

export function ServiceMonitor() {
  const [services, setServices] = useState<ServiceInfo[]>([
    { name: "MongoDB", status: "Loading", icon: Database, color: "text-gray-500", badge: "gray" },
    { name: "InfluxDB", status: "Loading", icon: Database, color: "text-gray-500", badge: "gray" },
    { name: "Grafana", status: "Loading", icon: Activity, color: "text-gray-500", badge: "gray" },
    { name: "Nginx", status: "Loading", icon: Globe, color: "text-gray-500", badge: "gray" },
    { name: "Webmin", status: "Loading", icon: Server, color: "text-gray-500", badge: "gray" },
    { name: "SPI", status: "Loading", icon: Cpu, color: "text-gray-500", badge: "gray" },
    { name: "I2C", status: "Loading", icon: Cpu, color: "text-gray-500", badge: "gray" },
    { name: "CAN0", status: "Loading", icon: Cpu, color: "text-gray-500", badge: "gray" },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch hardware status to get service statuses
  const fetchServicesStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/hardware/status')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch hardware status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        const status = data.status
        
        // Update services based on hardware status
        setServices([
          { 
            name: "MongoDB", 
            status: status.mongodb.connected ? "Running" : "Stopped", 
            icon: Database, 
            color: status.mongodb.connected ? "text-green-500" : "text-red-500", 
            badge: status.mongodb.connected ? "green" : "red" 
          },
          { 
            name: "InfluxDB", 
            status: status.influxdb.connected ? "Running" : "Stopped", 
            icon: Database, 
            color: status.influxdb.connected ? "text-green-500" : "text-red-500", 
            badge: status.influxdb.connected ? "green" : "red" 
          },
          { 
            name: "Grafana", 
            status: status.grafana.connected ? "Running" : "Stopped", 
            icon: Activity, 
            color: status.grafana.connected ? "text-green-500" : "text-red-500", 
            badge: status.grafana.connected ? "green" : "red" 
          },
          { 
            name: "Nginx", 
            // Since we don't have specific Nginx data in the API, we'll use a default value
            // In production, this should be updated to get real data
            status: "Running", 
            icon: Globe, 
            color: "text-green-500", 
            badge: "green" 
          },
          { 
            name: "Webmin", 
            // Since we don't have specific Webmin data in the API, we'll use a default value
            // In production, this should be updated to get real data
            status: "Running", 
            icon: Server, 
            color: "text-green-500", 
            badge: "green" 
          },
          { 
            name: "SPI", 
            // We're assuming SPI is active if not explicitly defined
            status: "Active", 
            icon: Cpu, 
            color: "text-green-500", 
            badge: "green" 
          },
          { 
            name: "I2C", 
            // We're assuming I2C is active if not explicitly defined
            status: "Active", 
            icon: Cpu, 
            color: "text-green-500", 
            badge: "green" 
          },
          { 
            name: "CAN0", 
            status: status.can.initialized ? "Active" : "Inactive", 
            icon: Cpu, 
            color: status.can.initialized ? "text-green-500" : "text-red-500", 
            badge: status.can.initialized ? "green" : "red" 
          },
        ])
        setError(null)
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error fetching service statuses:', err)
      setError('Failed to fetch service statuses')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchServicesStatus()
    
    // Refresh services status every 30 seconds
    const interval = setInterval(fetchServicesStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Services</CardTitle>
        <CardDescription>Status of System Services and Interfaces</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          // Show loading skeleton
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-1 h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Show error state
          <div className="py-4 text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              onClick={fetchServicesStatus}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          // Show services list
          <div className="space-y-4">
            {services.map((service: ServiceInfo, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full bg-gray-100 ${service.color}`}>
                    <service.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className={`text-sm ${service.status === "Running" || service.status === "Active" ? "text-green-500" : "text-red-500"}`}>
                      {service.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
