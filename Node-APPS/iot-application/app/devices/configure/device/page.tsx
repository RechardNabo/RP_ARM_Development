"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { useDeviceStore, type Device } from "@/lib/device-store"
import { Settings, Save, ArrowLeft, RefreshCw, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DeviceConfigurePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const deviceId = searchParams.get("id")
  const { toast } = useToast()

  const { devices, updateDevice } = useDeviceStore()
  const [device, setDevice] = useState<Device | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  // Form state
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState<Device["status"]>("online")
  const [pollingInterval, setPollingInterval] = useState(5000)
  const [isEnabled, setIsEnabled] = useState(true)
  const [alertThreshold, setAlertThreshold] = useState(80)
  const [protocolSettings, setProtocolSettings] = useState<Record<string, any>>({})

  // Load device data
  useEffect(() => {
    if (!deviceId) {
      toast({
        title: "Error",
        description: "No device ID provided",
        variant: "destructive",
      })
      router.push("/devices/configure")
      return
    }

    setIsLoading(true)

    // Find the device in the store
    const foundDevice = devices.find((d) => d.id === deviceId)

    if (!foundDevice) {
      toast({
        title: "Device Not Found",
        description: `Could not find device with ID ${deviceId}`,
        variant: "destructive",
      })
      router.push("/devices/configure")
      return
    }

    setDevice(foundDevice)

    // Initialize form state with device data
    setName(foundDevice.name)
    setLocation(foundDevice.location || "")
    setStatus(foundDevice.status)
    setIsEnabled(foundDevice.status !== "offline")

    // Initialize protocol settings
    if (foundDevice.settings) {
      setProtocolSettings(foundDevice.settings)

      // Set polling interval if available
      if (foundDevice.settings.interval) {
        setPollingInterval(foundDevice.settings.interval)
      }
    }

    setIsLoading(false)
  }, [deviceId, devices, router, toast])

  // Handle save
  const handleSave = () => {
    if (!device) return

    setIsSaving(true)

    // Prepare updated device data
    const updatedDevice: Partial<Device> = {
      name,
      location,
      status: isEnabled ? status : "offline",
      settings: {
        ...protocolSettings,
        interval: pollingInterval,
      },
    }

    // Update device in store
    setTimeout(() => {
      updateDevice(device.id, updatedDevice)

      toast({
        title: "Device Updated",
        description: `${name} has been updated successfully`,
      })

      setIsSaving(false)
    }, 800) // Simulate API delay
  }

  // Handle device restart
  const handleRestart = () => {
    if (!device) return

    toast({
      title: "Device Restarting",
      description: `${device.name} is restarting...`,
    })

    // Simulate restart
    setTimeout(() => {
      toast({
        title: "Device Restarted",
        description: `${device.name} has been restarted successfully`,
      })
    }, 2000)
  }

  // Handle back button
  const handleBack = () => {
    router.push("/devices/configure")
  }

  // Render protocol-specific settings
  const renderProtocolSettings = () => {
    if (!device) return null

    switch (device.protocol.toLowerCase()) {
      case "i2c":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">I2C Address</Label>
                <Input
                  id="address"
                  value={protocolSettings.address || "0x76"}
                  onChange={(e) => setProtocolSettings({ ...protocolSettings, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bus">I2C Bus</Label>
                <Select
                  value={protocolSettings.bus || "1"}
                  onValueChange={(value) => setProtocolSettings({ ...protocolSettings, bus: value })}
                >
                  <SelectTrigger id="bus">
                    <SelectValue placeholder="Select bus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Bus 0</SelectItem>
                    <SelectItem value="1">Bus 1</SelectItem>
                    <SelectItem value="2">Bus 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="speed">Clock Speed (Hz)</Label>
              <Select
                value={protocolSettings.speed || "100000"}
                onValueChange={(value) => setProtocolSettings({ ...protocolSettings, speed: value })}
              >
                <SelectTrigger id="speed">
                  <SelectValue placeholder="Select speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100000">100 kHz (Standard)</SelectItem>
                  <SelectItem value="400000">400 kHz (Fast)</SelectItem>
                  <SelectItem value="1000000">1 MHz (Fast Plus)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "spi":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bus">SPI Bus</Label>
                <Select
                  value={protocolSettings.bus || "0"}
                  onValueChange={(value) => setProtocolSettings({ ...protocolSettings, bus: value })}
                >
                  <SelectTrigger id="bus">
                    <SelectValue placeholder="Select bus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Bus 0</SelectItem>
                    <SelectItem value="1">Bus 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chipSelect">Chip Select</Label>
                <Select
                  value={protocolSettings.chipSelect || "0"}
                  onValueChange={(value) => setProtocolSettings({ ...protocolSettings, chipSelect: value })}
                >
                  <SelectTrigger id="chipSelect">
                    <SelectValue placeholder="Select CS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">CS 0</SelectItem>
                    <SelectItem value="1">CS 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="spiSpeed">Clock Speed (Hz)</Label>
              <Select
                value={protocolSettings.speed || "1000000"}
                onValueChange={(value) => setProtocolSettings({ ...protocolSettings, speed: value })}
              >
                <SelectTrigger id="spiSpeed">
                  <SelectValue placeholder="Select speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500000">500 kHz</SelectItem>
                  <SelectItem value="1000000">1 MHz</SelectItem>
                  <SelectItem value="2000000">2 MHz</SelectItem>
                  <SelectItem value="5000000">5 MHz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode">SPI Mode</Label>
              <Select
                value={protocolSettings.mode || "0"}
                onValueChange={(value) => setProtocolSettings({ ...protocolSettings, mode: value })}
              >
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Mode 0 (CPOL=0, CPHA=0)</SelectItem>
                  <SelectItem value="1">Mode 1 (CPOL=0, CPHA=1)</SelectItem>
                  <SelectItem value="2">Mode 2 (CPOL=1, CPHA=0)</SelectItem>
                  <SelectItem value="3">Mode 3 (CPOL=1, CPHA=1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "wi-fi":
      case "wifi":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input
                id="ipAddress"
                value={protocolSettings.ipAddress || "192.168.1.120"}
                onChange={(e) => setProtocolSettings({ ...protocolSettings, ipAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={protocolSettings.port || "80"}
                onChange={(e) => setProtocolSettings({ ...protocolSettings, port: e.target.value })}
              />
            </div>
            {device.type === "actuator" && (
              <div className="space-y-2">
                <Label htmlFor="brightness">Brightness</Label>
                <div className="pt-2">
                  <Slider
                    id="brightness"
                    min={0}
                    max={100}
                    step={1}
                    value={[protocolSettings.brightness || 75]}
                    onValueChange={(value) => setProtocolSettings({ ...protocolSettings, brightness: value[0] })}
                  />
                </div>
                <div className="text-right text-sm text-muted-foreground">{protocolSettings.brightness || 75}%</div>
              </div>
            )}
          </div>
        )

      case "bluetooth":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="macAddress">MAC Address</Label>
              <Input
                id="macAddress"
                value={protocolSettings.macAddress || "AA:BB:CC:DD:EE:FF"}
                onChange={(e) => setProtocolSettings({ ...protocolSettings, macAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="connectionType">Connection Type</Label>
              <Select
                value={protocolSettings.connectionType || "ble"}
                onValueChange={(value) => setProtocolSettings({ ...protocolSettings, connectionType: value })}
              >
                <SelectTrigger id="connectionType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ble">BLE (Bluetooth Low Energy)</SelectItem>
                  <SelectItem value="classic">Bluetooth Classic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "can":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="canId">CAN ID</Label>
                <Input
                  id="canId"
                  value={protocolSettings.canId || "0x123"}
                  onChange={(e) => setProtocolSettings({ ...protocolSettings, canId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canBitrate">Bitrate</Label>
                <Select
                  value={protocolSettings.bitrate || "500000"}
                  onValueChange={(value) => setProtocolSettings({ ...protocolSettings, bitrate: value })}
                >
                  <SelectTrigger id="canBitrate">
                    <SelectValue placeholder="Select bitrate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="125000">125 kbit/s</SelectItem>
                    <SelectItem value="250000">250 kbit/s</SelectItem>
                    <SelectItem value="500000">500 kbit/s</SelectItem>
                    <SelectItem value="1000000">1 Mbit/s</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="canInterface">Interface</Label>
              <Select
                value={protocolSettings.interface || "can0"}
                onValueChange={(value) => setProtocolSettings({ ...protocolSettings, interface: value })}
              >
                <SelectTrigger id="canInterface">
                  <SelectValue placeholder="Select interface" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="can0">can0</SelectItem>
                  <SelectItem value="can1">can1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "modbus":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modbusAddress">Slave Address</Label>
                <Input
                  id="modbusAddress"
                  type="number"
                  value={protocolSettings.address || "1"}
                  onChange={(e) => setProtocolSettings({ ...protocolSettings, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modbusMode">Mode</Label>
                <Select
                  value={protocolSettings.mode || "rtu"}
                  onValueChange={(value) => setProtocolSettings({ ...protocolSettings, mode: value })}
                >
                  <SelectTrigger id="modbusMode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rtu">RTU</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baudRate">Baud Rate</Label>
              <Select
                value={protocolSettings.baudRate || "9600"}
                onValueChange={(value) => setProtocolSettings({ ...protocolSettings, baudRate: value })}
              >
                <SelectTrigger id="baudRate">
                  <SelectValue placeholder="Select baud rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9600">9600</SelectItem>
                  <SelectItem value="19200">19200</SelectItem>
                  <SelectItem value="38400">38400</SelectItem>
                  <SelectItem value="57600">57600</SelectItem>
                  <SelectItem value="115200">115200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "mqtt":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mqttBroker">Broker URL</Label>
              <Input
                id="mqttBroker"
                value={protocolSettings.broker || "mqtt://broker.example.com"}
                onChange={(e) => setProtocolSettings({ ...protocolSettings, broker: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mqttPort">Port</Label>
                <Input
                  id="mqttPort"
                  type="number"
                  value={protocolSettings.port || "1883"}
                  onChange={(e) => setProtocolSettings({ ...protocolSettings, port: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mqttQos">QoS</Label>
                <Select
                  value={protocolSettings.qos || "0"}
                  onValueChange={(value) => setProtocolSettings({ ...protocolSettings, qos: value })}
                >
                  <SelectTrigger id="mqttQos">
                    <SelectValue placeholder="Select QoS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - At most once</SelectItem>
                    <SelectItem value="1">1 - At least once</SelectItem>
                    <SelectItem value="2">2 - Exactly once</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mqttTopic">Topic</Label>
              <Input
                id="mqttTopic"
                value={protocolSettings.topic || "devices/data"}
                onChange={(e) => setProtocolSettings({ ...protocolSettings, topic: e.target.value })}
              />
            </div>
          </div>
        )

      case "ethernet":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ethernetIp">IP Address</Label>
              <Input
                id="ethernetIp"
                value={protocolSettings.ipAddress || "192.168.1.100"}
                onChange={(e) => setProtocolSettings({ ...protocolSettings, ipAddress: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ethernetPort">Port</Label>
                <Input
                  id="ethernetPort"
                  type="number"
                  value={protocolSettings.port || "502"}
                  onChange={(e) => setProtocolSettings({ ...protocolSettings, port: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ethernetProtocol">Protocol</Label>
                <Select
                  value={protocolSettings.protocol || "tcp"}
                  onValueChange={(value) => setProtocolSettings({ ...protocolSettings, protocol: value })}
                >
                  <SelectTrigger id="ethernetProtocol">
                    <SelectValue placeholder="Select protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="py-4 text-center text-muted-foreground">
            No specific settings available for {device.protocol} protocol
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Configure Device</h1>
          <Settings className="h-6 w-6 text-blue-500" />
        </div>
        <p className="text-muted-foreground">Device not found</p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Devices
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Configure Device</h1>
          <Settings className="h-6 w-6 text-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={handleRestart}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Restart Device
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Device Settings</CardTitle>
            <CardDescription>Configure settings for {device.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="protocol">Protocol Settings</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceName">Device Name</Label>
                    <Input id="deviceName" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deviceLocation">Location</Label>
                    <Input
                      id="deviceLocation"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Server Room, Outdoor, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deviceStatus">Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value: Device["status"]) => setStatus(value)}
                      disabled={!isEnabled}
                    >
                      <SelectTrigger id="deviceStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="deviceEnabled" checked={isEnabled} onCheckedChange={setIsEnabled} />
                    <Label htmlFor="deviceEnabled">Device Enabled</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="protocol" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-4">
                    <div className="font-medium">Protocol:</div>
                    <Badge variant="outline">{device.protocol}</Badge>
                  </div>

                  {renderProtocolSettings()}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pollingInterval">Polling Interval (ms)</Label>
                    <div className="pt-2">
                      <Slider
                        id="pollingInterval"
                        min={1000}
                        max={60000}
                        step={1000}
                        value={[pollingInterval]}
                        onValueChange={(value) => setPollingInterval(value[0])}
                      />
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {pollingInterval} ms ({pollingInterval / 1000} seconds)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                    <div className="pt-2">
                      <Slider
                        id="alertThreshold"
                        min={0}
                        max={100}
                        step={5}
                        value={[alertThreshold]}
                        onValueChange={(value) => setAlertThreshold(value[0])}
                      />
                    </div>
                    <div className="text-right text-sm text-muted-foreground">{alertThreshold}%</div>
                  </div>

                  <div className="pt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Device
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the device and remove all
                            associated data from the system.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                              toast({
                                title: "Device Deleted",
                                description: `${device.name} has been deleted`,
                              })
                              router.push("/devices")
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Device Information</CardTitle>
              <CardDescription>Details about this device</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">ID:</div>
                  <div className="font-mono">{device.id}</div>

                  <div className="text-muted-foreground">Type:</div>
                  <div className="capitalize">{device.type}</div>

                  <div className="text-muted-foreground">Protocol:</div>
                  <div>{device.protocol}</div>

                  <div className="text-muted-foreground">Status:</div>
                  <div>
                    <Badge
                      variant={
                        device.status === "online" ? "success" : device.status === "warning" ? "warning" : "destructive"
                      }
                    >
                      {device.status}
                    </Badge>
                  </div>

                  <div className="text-muted-foreground">Last Seen:</div>
                  <div>{device.lastSeen}</div>

                  {device.battery && (
                    <>
                      <div className="text-muted-foreground">Battery:</div>
                      <div>{device.battery}</div>
                    </>
                  )}

                  {device.manufacturer && (
                    <>
                      <div className="text-muted-foreground">Manufacturer:</div>
                      <div>{device.manufacturer}</div>
                    </>
                  )}

                  {device.model && (
                    <>
                      <div className="text-muted-foreground">Model:</div>
                      <div>{device.model}</div>
                    </>
                  )}

                  {device.firmware && (
                    <>
                      <div className="text-muted-foreground">Firmware:</div>
                      <div>{device.firmware}</div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Device Status</CardTitle>
              <CardDescription>Current operational status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Power</div>
                  <Badge variant={isEnabled ? "success" : "destructive"}>{isEnabled ? "On" : "Off"}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Connection</div>
                  <Badge variant={device.status === "online" ? "success" : "destructive"}>
                    {device.status === "online" ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Data Transmission</div>
                  <Badge variant="outline">{device.status === "online" ? "Active" : "Inactive"}</Badge>
                </div>

                {device.battery && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Battery Level</div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          Number.parseInt(device.battery) > 50
                            ? "bg-green-500"
                            : Number.parseInt(device.battery) > 20
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: device.battery }}
                      ></div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">{device.battery}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
