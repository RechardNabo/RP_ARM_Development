"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Download, Bell, Power } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getServiceMonitor } from "@/lib/service-monitor"

export function QuickActions() {
  const router = useRouter()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

  // Handle Add Device button click
  const handleAddDevice = () => {
    router.push("/devices/add")
    toast({
      title: "Add Device",
      description: "Navigating to device creation page.",
    })
  }

  // Handle Refresh Data button click
  const handleRefreshData = async () => {
    setIsRefreshing(true)

    try {
      // Call our API endpoint to refresh all data
      const response = await fetch('/api/system/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to refresh data')
      }

      // Force a refresh of the current page
      router.refresh()

      toast({
        title: "Data Refreshed",
        description: `Dashboard data has been updated: ${result.refreshed?.join(', ')}.`,
      })
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "There was an error refreshing the data.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle Export Logs button click
  const handleExportLogs = async () => {
    setIsExporting(true)

    try {
      // Simulate log export with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Create a sample log content
      const logContent = `
[${new Date().toISOString()}] System started
[${new Date().toISOString()}] MongoDB connected
[${new Date().toISOString()}] InfluxDB connected
[${new Date().toISOString()}] Grafana service running
[${new Date().toISOString()}] Nginx service running
[${new Date().toISOString()}] Webmin service running
[${new Date().toISOString()}] SPI interface active
[${new Date().toISOString()}] I2C interface active
[${new Date().toISOString()}] CAN0 interface inactive
[${new Date().toISOString()}] Temperature sensor reading: 42°C
[${new Date().toISOString()}] Pressure sensor reading: 1013.2 hPa
[${new Date().toISOString()}] Flow sensor reading: 2.3 L/min
[${new Date().toISOString()}] Smart Light Controller status: On (75%)
[${new Date().toISOString()}] Motor Controller status: Off
[${new Date().toISOString()}] Gateway Node status: Active
[${new Date().toISOString()}] Bluetooth Beacon status: Connected
      `.trim()

      // Create a blob and download it
      const blob = new Blob([logContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `system-logs-${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Logs Exported",
        description: "System logs have been exported successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the logs.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Handle Clear Alerts button click
  const handleClearAlerts = async () => {
    setIsClearing(true)

    try {
      // Call our API endpoint to clear all alerts
      const response = await fetch('/api/alerts/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to clear alerts')
      }

      toast({
        title: "Alerts Cleared",
        description: `${result.count} system ${result.count === 1 ? 'alert has' : 'alerts have'} been cleared.`,
      })
      
      // Dispatch a custom event to notify the Recent Alerts component
      window.dispatchEvent(new CustomEvent('alertsCleared'))
      
      // Force a refresh of the current page to update other UI components
      router.refresh()
    } catch (error) {
      console.error('Error clearing alerts:', error)
      toast({
        title: "Clear Failed",
        description: error instanceof Error ? error.message : "There was an error clearing the alerts.",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  // Handle Restart Services button click
  const handleRestartServices = async () => {
    setIsRestarting(true)

    try {
      // List of services to restart
      const services = ["mongodb", "influxd", "grafana-server", "nginx", "webmin"]
      
      toast({
        title: "Restarting Services",
        description: "Attempting to restart all system services...",
      })

      // Call our API endpoint to restart services
      const response = await fetch('/api/services/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ services }),
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to restart services')
      }

      // Check if any services failed to restart
      const failedServices = result.results ? result.results
        .filter((r: { success: boolean; service: string }) => !r.success)
        .map((r: { service: string }) => r.service) : []
      
      if (failedServices.length > 0) {
        toast({
          title: "Partial Service Restart",
          description: `Some services failed to restart: ${failedServices.join(', ')}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Services Restarted",
          description: "All system services have been restarted successfully.",
        })
      }

      // Force a refresh of the current page to update the UI
      router.refresh()
    } catch (error) {
      console.error('Error restarting services:', error)
      toast({
        title: "Restart Failed",
        description: error instanceof Error ? error.message : "There was an error restarting the services.",
        variant: "destructive",
      })
    } finally {
      setIsRestarting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common system operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-9 justify-start" onClick={handleAddDevice}>
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 justify-start"
            onClick={handleRefreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 justify-start"
            onClick={handleExportLogs}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Logs"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 justify-start"
            onClick={handleClearAlerts}
            disabled={isClearing}
          >
            <Bell className="mr-2 h-4 w-4" />
            {isClearing ? "Clearing..." : "Clear Alerts"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 justify-start col-span-2"
            onClick={handleRestartServices}
            disabled={isRestarting}
          >
            <Power className="mr-2 h-4 w-4" />
            {isRestarting ? "Restarting..." : "Restart Services"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
