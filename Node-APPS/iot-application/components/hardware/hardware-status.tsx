"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Wifi, NetworkIcon, Database, Activity, Server } from "lucide-react"
import type { HardwareStatus as HardwareStatusType } from "@/lib/hardware/hardware-manager"

export function HardwareStatus() {
  const [status, setStatus] = useState<HardwareStatusType | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/hardware/status")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setStatus(data.status)
    } catch (error) {
      console.error("Failed to fetch hardware status:", error)
      // Provide fallback status for preview purposes
      setStatus({
        can: { initialized: false },
        wifi: { initialized: true, status: { connected: true, ssid: "Preview_Network" } },
        mongodb: { connected: false },
        influxdb: { connected: true },
        grafana: { connected: true },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Hardware Status</CardTitle>
            <CardDescription>CM4-IO-WIRELESS-BASE hardware status</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="can">CAN</TabsTrigger>
            <TabsTrigger value="wifi">Wi-Fi</TabsTrigger>
            <TabsTrigger value="databases">Databases</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex flex-col items-center justify-center p-4 border rounded-md">
                <NetworkIcon
                  className={`h-8 w-8 mb-2 ${status?.can.initialized ? "text-green-500" : "text-red-500"}`}
                />
                <span className="text-sm font-medium">CAN</span>
                <Badge className={status?.can.initialized ? "bg-green-500 mt-1" : "bg-red-500 mt-1"}>
                  {status?.can.initialized ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex flex-col items-center justify-center p-4 border rounded-md">
                <Wifi className={`h-8 w-8 mb-2 ${status?.wifi.initialized ? "text-green-500" : "text-red-500"}`} />
                <span className="text-sm font-medium">Wi-Fi</span>
                <Badge className={status?.wifi.initialized ? "bg-green-500 mt-1" : "bg-red-500 mt-1"}>
                  {status?.wifi.initialized ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex flex-col items-center justify-center p-4 border rounded-md">
                <Database className={`h-8 w-8 mb-2 ${status?.mongodb.connected ? "text-green-500" : "text-red-500"}`} />
                <span className="text-sm font-medium">MongoDB</span>
                <Badge className={status?.mongodb.connected ? "bg-green-500 mt-1" : "bg-red-500 mt-1"}>
                  {status?.mongodb.connected ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              <div className="flex flex-col items-center justify-center p-4 border rounded-md">
                <Database
                  className={`h-8 w-8 mb-2 ${status?.influxdb.connected ? "text-green-500" : "text-red-500"}`}
                />
                <span className="text-sm font-medium">InfluxDB</span>
                <Badge className={status?.influxdb.connected ? "bg-green-500 mt-1" : "bg-red-500 mt-1"}>
                  {status?.influxdb.connected ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              <div className="flex flex-col items-center justify-center p-4 border rounded-md">
                <Activity className={`h-8 w-8 mb-2 ${status?.grafana.connected ? "text-green-500" : "text-red-500"}`} />
                <span className="text-sm font-medium">Grafana</span>
                <Badge className={status?.grafana.connected ? "bg-green-500 mt-1" : "bg-red-500 mt-1"}>
                  {status?.grafana.connected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="can">
            {status?.can.stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2">RX Statistics</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Packets:</span>
                      <span>{status.can.stats.rxPackets}</span>
                      <span className="text-muted-foreground">Errors:</span>
                      <span>{status.can.stats.rxErrors}</span>
                      <span className="text-muted-foreground">Dropped:</span>
                      <span>{status.can.stats.rxDropped}</span>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2">TX Statistics</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Packets:</span>
                      <span>{status.can.stats.txPackets}</span>
                      <span className="text-muted-foreground">Errors:</span>
                      <span>{status.can.stats.txErrors}</span>
                      <span className="text-muted-foreground">Dropped:</span>
                      <span>{status.can.stats.txDropped}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    Start Monitoring
                  </Button>
                  <Button variant="outline" size="sm">
                    Send Test Message
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? "Loading CAN interface status..." : "CAN interface not initialized or not available"}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wifi">
            {status?.wifi.status ? (
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium mb-2">Wi-Fi Status</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Connected:</span>
                    <span>{status.wifi.status.connected ? "Yes" : "No"}</span>

                    {status.wifi.status.connected && (
                      <>
                        <span className="text-muted-foreground">SSID:</span>
                        <span>{status.wifi.status.ssid}</span>

                        <span className="text-muted-foreground">IP Address:</span>
                        <span>{status.wifi.status.ipAddress}</span>

                        <span className="text-muted-foreground">MAC Address:</span>
                        <span>{status.wifi.status.macAddress}</span>

                        <span className="text-muted-foreground">Signal Strength:</span>
                        <span>{status.wifi.status.signalStrength} dBm</span>

                        {status.wifi.status.bitrate && (
                          <>
                            <span className="text-muted-foreground">Bitrate:</span>
                            <span>{status.wifi.status.bitrate} Mb/s</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    Scan Networks
                  </Button>
                  {status.wifi.status.connected ? (
                    <Button variant="outline" size="sm">
                      Disconnect
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? "Loading Wi-Fi status..." : "Wi-Fi interface not initialized or not available"}
              </div>
            )}
          </TabsContent>

          <TabsContent value="databases">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">MongoDB</h3>
                  <Badge className={status?.mongodb.connected ? "bg-green-500" : "bg-red-500"}>
                    {status?.mongodb.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Host:</span>
                  <span>localhost:27017</span>
                  <span className="text-muted-foreground">Database:</span>
                  <span>cm4_iot_data</span>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">InfluxDB</h3>
                  <Badge className={status?.influxdb.connected ? "bg-green-500" : "bg-red-500"}>
                    {status?.influxdb.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">URL:</span>
                  <span>http://localhost:8086</span>
                  <span className="text-muted-foreground">Bucket:</span>
                  <span>cm4_iot_data</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Test Connections
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Grafana</h3>
                  <Badge className={status?.grafana.connected ? "bg-green-500" : "bg-red-500"}>
                    {status?.grafana.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">URL:</span>
                  <span>http://localhost:3000</span>
                  <span className="text-muted-foreground">Status:</span>
                  <span>{status?.grafana.connected ? "Running" : "Not available"}</span>
                </div>

                {status?.grafana.connected && (
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
                        <Server className="mr-2 h-4 w-4" />
                        Open Grafana Dashboard
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Check Services
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
