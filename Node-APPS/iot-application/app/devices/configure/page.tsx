"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Settings, ArrowLeft, Search, Wrench } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample device data
const devices = [
  {
    id: "dev-001",
    name: "Temperature Sensor",
    type: "sensor",
    protocol: "I2C",
    status: "online",
    lastSeen: "2 minutes ago",
    value: "24.5°C",
  },
  {
    id: "dev-002",
    name: "Pressure Sensor",
    type: "sensor",
    protocol: "SPI",
    status: "online",
    lastSeen: "5 minutes ago",
    value: "1013.2 hPa",
  },
  {
    id: "dev-003",
    name: "Smart Light Controller",
    type: "actuator",
    protocol: "Wi-Fi",
    status: "online",
    lastSeen: "1 minute ago",
    value: "On (75%)",
  },
  {
    id: "dev-004",
    name: "Motor Controller",
    type: "actuator",
    protocol: "CAN",
    status: "offline",
    lastSeen: "2 hours ago",
    value: "Off",
  },
  {
    id: "dev-005",
    name: "Gateway Node",
    type: "gateway",
    protocol: "Ethernet",
    status: "warning",
    lastSeen: "Just now",
    value: "Active",
  },
]

export default function DevicesConfigurePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [viewType, setViewType] = useState("grid")

  // Filter devices based on search term
  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.protocol.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle device selection
  const handleSelectDevice = (deviceId: string) => {
    // For now, just show an alert
    alert(`Configure device: ${deviceId}`)
    // In a real implementation, we would navigate to the device configuration page
    // router.push(`/devices/configure/device?id=${deviceId}`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Configure Device</h1>
          <Settings className="h-6 w-6 text-blue-500" />
        </div>
        <Button variant="outline" onClick={() => router.push("/devices")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Devices
        </Button>
      </div>

      <p className="text-muted-foreground">Select a device to configure its settings</p>

      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search devices..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs defaultValue={viewType} onValueChange={setViewType}>
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewType === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <Card key={device.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{device.name}</CardTitle>
                  <Badge
                    variant={
                      device.status === "online" ? "success" : device.status === "warning" ? "warning" : "destructive"
                    }
                  >
                    {device.status}
                  </Badge>
                </div>
                <CardDescription>
                  {device.type} - {device.protocol}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-medium">{device.value || "N/A"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Last Seen:</span>
                    <span className="font-medium">{device.lastSeen || "Unknown"}</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => handleSelectDevice(device.id)}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell className="capitalize">{device.type}</TableCell>
                    <TableCell>{device.protocol}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          device.status === "online"
                            ? "success"
                            : device.status === "warning"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.lastSeen || "Unknown"}</TableCell>
                    <TableCell>{device.value || "N/A"}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleSelectDevice(device.id)}>
                        Configure
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
