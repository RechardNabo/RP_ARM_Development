"use client"

import React, { useEffect } from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Wifi,
  Bluetooth,
  NetworkIcon,
  Cpu,
  Thermometer,
  Gauge,
  MoreHorizontal,
  Edit,
  Trash2,
  Settings,
  Activity,
  Server,
  Radio,
  Database,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DeviceFilters } from "./device-filters"
import { useToast } from "@/hooks/use-toast"

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
    battery: "95%",
    icon: Thermometer,
    iconColor: "text-red-500",
  },
  {
    id: "dev-002",
    name: "Pressure Sensor",
    type: "sensor",
    protocol: "SPI",
    status: "online",
    lastSeen: "5 minutes ago",
    value: "1013.2 hPa",
    battery: "87%",
    icon: Gauge,
    iconColor: "text-blue-500",
  },
  {
    id: "dev-003",
    name: "Smart Light Controller",
    type: "actuator",
    protocol: "Wi-Fi",
    status: "online",
    lastSeen: "1 minute ago",
    value: "On (75%)",
    battery: "N/A",
    icon: Wifi,
    iconColor: "text-amber-500",
  },
  {
    id: "dev-004",
    name: "Motor Controller",
    type: "actuator",
    protocol: "CAN",
    status: "offline",
    lastSeen: "2 hours ago",
    value: "Off",
    battery: "N/A",
    icon: Cpu,
    iconColor: "text-gray-500",
  },
  {
    id: "dev-005",
    name: "Gateway Node",
    type: "gateway",
    protocol: "Ethernet",
    status: "warning",
    lastSeen: "Just now",
    value: "Active",
    battery: "N/A",
    icon: NetworkIcon,
    iconColor: "text-green-500",
  },
  {
    id: "dev-006",
    name: "Bluetooth Beacon",
    type: "sensor",
    protocol: "Bluetooth",
    status: "online",
    lastSeen: "3 minutes ago",
    value: "Connected",
    battery: "72%",
    icon: Bluetooth,
    iconColor: "text-indigo-500",
  },
  {
    id: "dev-007",
    name: "Flow Sensor",
    type: "sensor",
    protocol: "MODBUS",
    status: "warning",
    lastSeen: "10 minutes ago",
    value: "2.3 L/min",
    battery: "15%",
    icon: Activity,
    iconColor: "text-purple-500",
  },
  {
    id: "dev-008",
    name: "MQTT Bridge",
    type: "gateway",
    protocol: "MQTT",
    status: "online",
    lastSeen: "1 minute ago",
    value: "Connected",
    battery: "N/A",
    icon: Server,
    iconColor: "text-teal-500",
  },
  {
    id: "dev-009",
    name: "RF Transceiver",
    type: "controller",
    protocol: "Wi-Fi",
    status: "error",
    lastSeen: "1 day ago",
    value: "Disconnected",
    battery: "0%",
    icon: Radio,
    iconColor: "text-rose-500",
  },
  {
    id: "dev-010",
    name: "Data Logger",
    type: "controller",
    protocol: "Ethernet",
    status: "online",
    lastSeen: "Just now",
    value: "Recording",
    battery: "N/A",
    icon: Database,
    iconColor: "text-sky-500",
  },
]

// Helper function to get the icon for a protocol
const getProtocolIcon = (protocol: string) => {
  switch (protocol.toLowerCase()) {
    case "wi-fi":
      return Wifi
    case "bluetooth":
      return Bluetooth
    case "ethernet":
      return NetworkIcon
    case "i2c":
      return Cpu
    case "spi":
      return Cpu
    case "can":
      return Cpu
    case "modbus":
      return Activity
    case "mqtt":
      return Server
    default:
      return Cpu
  }
}

// Protocol mapping for filter matching
const protocolMapping: Record<string, keyof DeviceFilters["protocol"]> = {
  "wi-fi": "wifi",
  wifi: "wifi",
  bluetooth: "bluetooth",
  ethernet: "ethernet",
  i2c: "i2c",
  spi: "spi",
  can: "can",
  modbus: "modbus",
  mqtt: "mqtt",
}

export function DeviceList({ filters }: { filters: DeviceFilters | null }) {
  const { toast } = useToast()
  const [viewType, setViewType] = useState("table")
  const [filteredDevices, setFilteredDevices] = useState(devices)
  const [isLoading, setIsLoading] = useState(false)
  const [filterSummary, setFilterSummary] = useState("")

  // Apply filters when they change
  useEffect(() => {
    if (!filters) {
      setFilteredDevices(devices)
      setFilterSummary("")
      return
    }

    setIsLoading(true)

    // Simulate API delay
    setTimeout(() => {
      const filtered = devices.filter((device) => {
        // Search filter
        if (
          filters.search &&
          !device.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !device.type.toLowerCase().includes(filters.search.toLowerCase()) &&
          !device.protocol.toLowerCase().includes(filters.search.toLowerCase())
        ) {
          return false
        }

        // Status filter
        if (
          (!filters.status.online && device.status === "online") ||
          (!filters.status.offline && device.status === "offline") ||
          (!filters.status.warning && device.status === "warning") ||
          (!filters.status.error && device.status === "error")
        ) {
          return false
        }

        // Protocol filter
        const protocolKey = protocolMapping[device.protocol.toLowerCase()]
        if (protocolKey && !filters.protocol[protocolKey]) {
          return false
        }

        // Device type filter
        if (filters.deviceType !== "all" && device.type !== filters.deviceType) {
          return false
        }

        return true
      })

      setFilteredDevices(filtered)
      setIsLoading(false)

      // Create filter summary
      const summaryParts = []

      // Add search term if present
      if (filters.search) {
        summaryParts.push(`matching "${filters.search}"`)
      }

      // Add status filters
      const activeStatuses = Object.entries(filters.status)
        .filter(([_, isActive]) => isActive)
        .map(([status]) => status)

      if (activeStatuses.length < 4 && activeStatuses.length > 0) {
        summaryParts.push(`with status ${activeStatuses.join(", ")}`)
      }

      // Add protocol filters
      const activeProtocols = Object.entries(filters.protocol)
        .filter(([_, isActive]) => isActive)
        .map(([protocol]) => protocol.toUpperCase())

      if (activeProtocols.length < 8 && activeProtocols.length > 0) {
        summaryParts.push(`using ${activeProtocols.join(", ")}`)
      }

      // Add device type
      if (filters.deviceType !== "all") {
        summaryParts.push(`of type ${filters.deviceType}`)
      }

      // Combine all parts
      const summary = summaryParts.length > 0 ? `Filtered: ${summaryParts.join(", ")}` : ""

      setFilterSummary(summary)

      // Show toast notification
      toast({
        title: "Filters Applied",
        description: `Showing ${filtered.length} of ${devices.length} devices`,
      })
    }, 500)
  }, [filters, toast])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Device List</CardTitle>
            <CardDescription>
              {isLoading
                ? "Filtering devices..."
                : filterSummary
                  ? `Showing ${filteredDevices.length} of ${devices.length} devices • ${filterSummary}`
                  : `Showing ${filteredDevices.length} devices`}
            </CardDescription>
          </div>
          <Tabs defaultValue="table" onValueChange={setViewType}>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="grid">Grid</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="m-0">
              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Protocol</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Battery</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevices.length > 0 ? (
                      filteredDevices.map((device) => (
                        <TableRow key={device.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <device.icon className={`h-4 w-4 ${device.iconColor}`} />
                              {device.name}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{device.type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {React.createElement(getProtocolIcon(device.protocol), {
                                className: "h-4 w-4",
                              })}
                              {device.protocol}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                device.status === "online"
                                  ? "success"
                                  : device.status === "warning"
                                    ? "warning"
                                    : device.status === "error"
                                      ? "destructive"
                                      : "outline"
                              }
                            >
                              {device.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{device.lastSeen}</TableCell>
                          <TableCell>{device.value}</TableCell>
                          <TableCell>{device.battery}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Configure
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Activity className="mr-2 h-4 w-4" />
                                  View Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No devices match the current filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="grid" className="m-0">
              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                {filteredDevices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDevices.map((device) => (
                      <Card key={device.id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <device.icon className={`h-5 w-5 ${device.iconColor}`} />
                              <CardTitle className="text-base">{device.name}</CardTitle>
                            </div>
                            <Badge
                              variant={
                                device.status === "online"
                                  ? "success"
                                  : device.status === "warning"
                                    ? "warning"
                                    : device.status === "error"
                                      ? "destructive"
                                      : "outline"
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
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex flex-col">
                              <span className="text-muted-foreground">Value:</span>
                              <span className="font-medium">{device.value}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground">Battery:</span>
                              <span className="font-medium">{device.battery}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground">Last Seen:</span>
                              <span className="font-medium">{device.lastSeen}</span>
                            </div>
                            <div className="flex items-end justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configure
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Activity className="mr-2 h-4 w-4" />
                                    View Data
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">No devices match the current filters</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  )
}
