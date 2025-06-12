import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface Alert {
  id: string
  title: string
  description: string
  timestamp: number
  severity: "high" | "medium" | "info"
}

// Function to format timestamp to relative time (e.g., "10 minutes ago")
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  let interval = seconds / 31536000 // years
  if (interval > 1) return Math.floor(interval) + " years ago"
  
  interval = seconds / 2592000 // months
  if (interval > 1) return Math.floor(interval) + " months ago"
  
  interval = seconds / 86400 // days
  if (interval > 1) return Math.floor(interval) + " days ago"
  
  interval = seconds / 3600 // hours
  if (interval > 1) return Math.floor(interval) + " hours ago"
  
  interval = seconds / 60 // minutes
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  
  return Math.floor(seconds) + " seconds ago"
}

export function RecentAlerts() {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/alerts/get')
      const data = await response.json()
      
      if (data.success) {
        setAlerts(data.alerts)
      } else {
        console.error("Error fetching alerts:", data.error)
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch alerts on component mount and every minute
  useEffect(() => {
    fetchAlerts()
    
    // Set up interval to refresh alerts every minute
    const intervalId = setInterval(fetchAlerts, 60000)
    
    // Set up event listener for when alerts are cleared
    const handleAlertsCleared = () => {
      fetchAlerts()
    }
    
    // Add event listener for the custom event
    window.addEventListener('alertsCleared', handleAlertsCleared)
    
    // Clean up interval and event listener on unmount
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('alertsCleared', handleAlertsCleared)
    }
  }, [])
  
  // If no real alerts are available, use sample placeholder alerts
  const placeholderAlerts = [
    {
      id: 1,
      title: "CAN0 Interface Down",
      description: "CAN0 interface is not responding",
      time: "10 minutes ago",
      severity: "high",
      icon: AlertTriangle,
      color: "text-red-500",
      badge: "bg-red-500",
    },
    {
      id: 2,
      title: "Temperature Sensor Warning",
      description: "Temperature above threshold (42°C)",
      time: "25 minutes ago",
      severity: "medium",
      icon: AlertCircle,
      color: "text-amber-500",
      badge: "bg-amber-500",
    },
    {
      id: 3,
      title: "New Device Connected",
      description: "Temperature sensor connected via I2C",
      time: "1 hour ago",
      severity: "info",
      icon: Info,
      color: "text-blue-500",
      badge: "bg-blue-500",
    },
    {
      id: 4,
      title: "System Update Available",
      description: "New firmware update available",
      time: "3 hours ago",
      severity: "info",
      icon: Info,
      color: "text-blue-500",
      badge: "bg-blue-500",
    },
  ]

  // Function to get icon based on severity
  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return AlertTriangle
      case "medium":
        return AlertCircle
      default:
        return Info
    }
  }
  
  // Function to get color based on severity
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-amber-500"
      default:
        return "text-blue-500"
    }
  }
  
  // Function to get badge color based on severity
  const getAlertBadgeColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-amber-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Alerts</CardTitle>
        <CardDescription>Latest system and device alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[220px] pr-4">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : alerts.length > 0 ? (
            // Display actual alerts
            <div className="space-y-4">
              {alerts.map((alert) => {
                const Icon = getAlertIcon(alert.severity)
                const color = getAlertColor(alert.severity)
                const badgeColor = getAlertBadgeColor(alert.severity)
                
                return (
                  <div key={alert.id} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className={`mt-0.5 ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <Badge className={badgeColor}>{alert.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(alert.timestamp)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // No alerts message
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">No alerts to display</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
