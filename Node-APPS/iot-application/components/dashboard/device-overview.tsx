import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wifi, Bluetooth, NetworkIcon, Cpu, Thermometer, Gauge, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

// Interface for device counts data
interface DeviceCountsData {
  success: boolean
  counts: {
    wifi: number
    bluetooth: number
    ethernet: number
    i2c: number
    spi: number
    sensors: number
  }
}

export function DeviceOverview() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deviceCounts, setDeviceCounts] = useState<DeviceCountsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch device counts
  const fetchDeviceCounts = async () => {
    if (!isLoading) {
      setIsRefreshing(true)
    }
    
    setError(null)
    
    try {
      const response = await fetch('/api/devices/count')
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setDeviceCounts(data)
      
      if (!isLoading && isRefreshing) {
        toast({
          title: "Device counts refreshed",
          description: "Connected device information has been updated.",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch device counts'
      setError(errorMessage)
      
      if (!isLoading) {
        toast({
          title: "Refresh failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchDeviceCounts()
    
    // Setup auto refresh every 60 seconds
    const intervalId = setInterval(fetchDeviceCounts, 60000)
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  // Function to render device row
  const DeviceRow = ({ 
    icon: Icon, 
    label, 
    count, 
    color 
  }: { 
    icon: any, 
    label: string, 
    count: number | undefined, 
    color: string 
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-between hover:bg-accent hover:text-accent-foreground p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-sm font-medium">{label}</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-5 w-12 rounded" />
            ) : (
              <Badge variant={count && count > 0 ? "outline" : "secondary"}>
                {count !== undefined ? `${count} device${count !== 1 ? 's' : ''}` : "Unknown"}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">{getDeviceTooltip(label, count)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  // Helper function for tooltip content
  const getDeviceTooltip = (type: string, count: number | undefined): string => {
    if (count === undefined) return `Unable to detect ${type} devices`
    if (count === 0) return `No ${type} devices detected`
    if (count === 1) return `1 ${type} device connected`
    return `${count} ${type} devices connected`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Device Overview</CardTitle>
          <CardDescription>Connected devices by protocol</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDeviceCounts}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? "Refreshing" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <DeviceRow
            icon={Wifi}
            label="Wi-Fi"
            count={deviceCounts?.counts.wifi}
            color="text-blue-500"
          />
          
          <DeviceRow
            icon={Bluetooth}
            label="Bluetooth"
            count={deviceCounts?.counts.bluetooth}
            color="text-indigo-500"
          />
          
          <DeviceRow
            icon={NetworkIcon}
            label="Ethernet"
            count={deviceCounts?.counts.ethernet}
            color="text-green-500"
          />
          
          <DeviceRow
            icon={Cpu}
            label="I2C"
            count={deviceCounts?.counts.i2c}
            color="text-amber-500"
          />
          
          <DeviceRow
            icon={Gauge}
            label="SPI"
            count={deviceCounts?.counts.spi}
            color="text-red-500"
          />
          
          <DeviceRow
            icon={Thermometer}
            label="Sensors"
            count={deviceCounts?.counts.sensors}
            color="text-purple-500"
          />
        </div>
      </CardContent>
    </Card>
  )
}
