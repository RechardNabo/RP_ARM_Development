"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Monitor, CheckCircle, XCircle, Cpu, Radio, Bluetooth, Usb, Layers, ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Define interface for hardware status data
interface HardwareStatusData {
  success: boolean
  status: {
    can: {
      initialized: boolean
      stats?: any
    }
    wifi: {
      initialized: boolean
      status?: {
        connected: boolean
        ssid?: string
        ipAddress?: string
        macAddress?: string
        signalStrength?: number
      }
    }
    i2c: {
      available: boolean
      buses: string[]
      devices?: { [bus: string]: string[] }
    }
    spi: {
      available: boolean
      devices: string[]
    }
    bluetooth: {
      available: boolean
      powered: boolean
      controllerName?: string
    }
    mongodb: { connected: boolean }
    influxdb: { connected: boolean }
    grafana: { connected: boolean }
  }
}

export function HardwareStatus() {
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hardwareData, setHardwareData] = useState<HardwareStatusData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch hardware status
  const fetchHardwareStatus = async () => {
    setIsRefreshing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/hardware/status')
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setHardwareData(data)
      
      if (isLoading) {
        setIsLoading(false)
      } else {
        toast({
          title: "Hardware status refreshed",
          description: "Hardware status information has been updated.",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch hardware status'
      setError(errorMessage)
      
      if (!isLoading) {
        toast({
          title: "Refresh failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsRefreshing(false)
    }
  }
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchHardwareStatus()
    
    // Setup auto refresh every 30 seconds
    const intervalId = setInterval(fetchHardwareStatus, 30000)
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])
  
  const handleRefresh = () => {
    fetchHardwareStatus()
  }

  // Helper function to render status indicator
  const StatusIndicator = ({ available, label, icon: Icon, details }: { available: boolean, label: string, icon: any, details?: string }) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent hover:text-accent-foreground">
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${available ? 'text-green-500' : 'text-red-500'}`} />
                <span>{label}</span>
              </div>
              {details ? (
                <Badge variant={available ? 'outline' : 'destructive'} className="ml-2">
                  {details}
                </Badge>
              ) : (
                <div className={`h-2 w-2 rounded-full ${available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm">
            <p>
              {available
                ? `${label} is available and working properly.`
                : `${label} is not available or not working properly.`}
            </p>
            {details && <p className="text-xs opacity-80 mt-1">{details}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-bold">Hardware Status</CardTitle>
            <CardDescription>Raspberry Pi hardware interfaces</CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Hardware Status</CardTitle>
          <CardDescription>Raspberry Pi hardware interfaces</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="icon">
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center p-6 text-red-500">
            <ServerCrash className="h-5 w-5 mr-2" />
            <span>Error loading hardware status: {error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Wi-Fi Status */}
            <StatusIndicator 
              available={hardwareData?.status.wifi.initialized || false}
              label="Wi-Fi Module"
              icon={Radio}
              details={hardwareData?.status.wifi.status?.ipAddress || ''}
            />
            
            {/* Bluetooth Status */}
            <StatusIndicator 
              available={hardwareData?.status.bluetooth.available && hardwareData?.status.bluetooth.powered || false}
              label="Bluetooth Module"
              icon={Bluetooth}
              details={hardwareData?.status.bluetooth.controllerName || ''}
            />
            
            {/* CAN Interface Status */}
            <StatusIndicator 
              available={hardwareData?.status.can.initialized || false}
              label="CAN Interface"
              icon={Usb}
            />
            
            {/* I2C Bus Status */}
            <StatusIndicator 
              available={hardwareData?.status.i2c.available || false}
              label="I2C Buses"
              icon={Layers}
              details={hardwareData?.status.i2c.buses?.length ? `${hardwareData?.status.i2c.buses.length} bus(es)` : 'None'}
            />
            
            {/* SPI Bus Status */}
            <StatusIndicator 
              available={hardwareData?.status.spi.available || false}
              label="SPI Interfaces"
              icon={Cpu}
              details={hardwareData?.status.spi.devices?.length ? `${hardwareData?.status.spi.devices.length} device(s)` : 'None'}
            />
            
            {/* System Database Status */}
            <StatusIndicator 
              available={hardwareData?.status.mongodb.connected || false}
              label="System Database"
              icon={CheckCircle}
            />
            
            {/* Time-Series Database Status */}
            <StatusIndicator 
              available={hardwareData?.status.influxdb.connected || false}
              label="Time-Series DB"
              icon={CheckCircle}
            />
            
            {/* Dashboard Service Status */}
            <StatusIndicator 
              available={hardwareData?.status.grafana.connected || false}
              label="Dashboard Service"
              icon={CheckCircle}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
