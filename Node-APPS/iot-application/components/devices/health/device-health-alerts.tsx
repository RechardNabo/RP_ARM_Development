"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Battery, Signal, ThermometerSnowflake, Clock, CheckCircle2 } from "lucide-react"
import { useDeviceStore } from "@/lib/device-store"

interface Alert {
  id: string
  deviceId: string
  deviceName: string
  type: "battery" | "connectivity" | "temperature" | "performance" | "other"
  severity: "critical" | "warning" | "info"
  message: string
  timestamp: Date
  acknowledged: boolean
}

export function DeviceHealthAlerts() {
  const { devices } = useDeviceStore()
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    // Generate sample alerts based on devices
    const sampleAlerts: Alert[] = []

    // Low battery alerts
    devices
      .filter((d) => d.battery && d.battery !== "N/A")
      .filter((d) => {
        const batteryLevel = Number.parseInt(d.battery?.replace("%", "") || "0")
        return batteryLevel < 30
      })
      .forEach((device) => {
        const batteryLevel = Number.parseInt(device.battery?.replace("%", "") || "0")
        sampleAlerts.push({
          id: `batt-${device.id}`,
          deviceId: device.id,
          deviceName: device.name,
          type: "battery",
          severity: batteryLevel < 15 ? "critical" : "warning",
          message: `Low battery (${device.battery})`,
          timestamp: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
          acknowledged: false,
        })
      })

    // Connectivity alerts
    devices
      .filter((d) => d.status === "offline" || d.status === "error")
      .forEach((device) => {
        sampleAlerts.push({
          id: `conn-${device.id}`,
          deviceId: device.id,
          deviceName: device.name,
          type: "connectivity",
          severity: device.status === "error" ? "critical" : "warning",
          message: device.status === "error" ? "Connection error" : "Device offline",
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          acknowledged: false,
        })
      })

    // Add some random temperature alerts
    const randomDevices = [...devices].sort(() => 0.5 - Math.random()).slice(0, 2)
    randomDevices.forEach((device) => {
      sampleAlerts.push({
        id: `temp-${device.id}`,
        deviceId: device.id,
        deviceName: device.name,
        type: "temperature",
        severity: Math.random() > 0.5 ? "critical" : "warning",
        message: Math.random() > 0.5 ? "Temperature too high" : "Temperature rising",
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        acknowledged: false,
      })
    })

    // Sort by timestamp (newest first)
    sampleAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    setAlerts(sampleAlerts)
  }, [devices])

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))
  }

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "battery":
        return <Battery className="h-4 w-4" />
      case "connectivity":
        return <Signal className="h-4 w-4" />
      case "temperature":
        return <ThermometerSnowflake className="h-4 w-4" />
      case "performance":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "warning":
        return "bg-amber-500"
      case "info":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60)
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`
    } else {
      const days = Math.floor(diffMins / 1440)
      return `${days} day${days !== 1 ? "s" : ""} ago`
    }
  }

  return (
    <div className="space-y-4">
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
          <p>No active alerts</p>
          <p className="text-xs">All devices are operating normally</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${alert.acknowledged ? "bg-muted/50" : "bg-background"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Badge className={getSeverityColor(alert.severity)}>{getAlertIcon(alert.type)}</Badge>
                    <div>
                      <h4 className={`font-medium ${alert.acknowledged ? "text-muted-foreground" : ""}`}>
                        {alert.deviceName}
                      </h4>
                      <p className={`text-sm ${alert.acknowledged ? "text-muted-foreground" : ""}`}>{alert.message}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button variant="ghost" size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                      Ack
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="flex justify-between items-center pt-2">
        <div className="text-sm text-muted-foreground">
          {alerts.filter((a) => !a.acknowledged).length} unacknowledged
        </div>
        <Button variant="outline" size="sm">
          View All Alerts
        </Button>
      </div>
    </div>
  )
}
