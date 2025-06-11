"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wifi, NetworkIcon, Globe, RefreshCw, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

// Define interface for network status data
interface NetworkStatusData {
  success: boolean
  networkStatus: {
    wifi: {
      connected: boolean
      ssid?: string
      ipAddress?: string
      signalStrength?: number
    }
    ethernet: {
      connected: boolean
      ipAddress?: string
      speed?: string
    }
    internet: {
      connected: boolean
      status?: string
      ping?: number
    }
  }
  error?: string
}

export function NetworkStatus() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [networkData, setNetworkData] = useState<NetworkStatusData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Function to fetch network status
  const fetchNetworkStatus = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/network/status')
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setNetworkData(data)
      
      if (isLoading) {
        setIsLoading(false)
      } else {
        toast({
          title: "Network status refreshed",
          description: "Network information has been updated.",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch network status'
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
    fetchNetworkStatus()
    
    // Setup auto refresh every 60 seconds
    const intervalId = setInterval(fetchNetworkStatus, 60000)
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])
  
  const handleRefresh = () => {
    fetchNetworkStatus()
  }

  // Loading skeleton UI
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-bold">Network Status</CardTitle>
            <CardDescription>Current network connections</CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-[100px]" />
                  <Skeleton className="h-5 w-[80px]" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[40px]" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-bold">Network Status</CardTitle>
            <CardDescription>Current network connections</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Failed to load network status</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { wifi, ethernet, internet } = networkData?.networkStatus || {}

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Network Status</CardTitle>
          <CardDescription>Current network connections</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Wi-Fi</span>
            </div>
            <Badge className={wifi?.connected ? "bg-green-500" : "bg-gray-500"}>
              {wifi?.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          {wifi?.connected && (
            <div className="pl-6 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>SSID:</span>
                <span>{wifi?.ssid || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span>IP:</span>
                <span>{wifi?.ipAddress || "Not assigned"}</span>
              </div>
              <div className="flex justify-between">
                <span>Signal:</span>
                <span>{wifi?.signalStrength ? `${wifi.signalStrength} dBm` : "Unknown"}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <NetworkIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Ethernet</span>
            </div>
            <Badge className={ethernet?.connected ? "bg-green-500" : "bg-gray-500"}>
              {ethernet?.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          {ethernet?.connected && (
            <div className="pl-6 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>IP:</span>
                <span>{ethernet?.ipAddress || "Not assigned"}</span>
              </div>
              <div className="flex justify-between">
                <span>Speed:</span>
                <span>{ethernet?.speed || "Unknown"}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Internet</span>
            </div>
            <Badge className={internet?.connected ? "bg-green-500" : "bg-gray-500"}>
              {internet?.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          {internet?.connected && (
            <div className="pl-6 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span>{internet?.status || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span>Ping:</span>
                <span>{internet?.ping ? `${internet.ping} ms` : "Unknown"}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
