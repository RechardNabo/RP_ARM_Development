"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Wifi, Bluetooth, NetworkIcon, Cpu, Radio, Globe, Gauge, Plus, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const protocols = [
  { id: "wifi", name: "Wi-Fi", icon: Wifi, color: "text-blue-500" },
  { id: "bluetooth", name: "Bluetooth / BLE", icon: Bluetooth, color: "text-indigo-500" },
  { id: "ethernet", name: "Ethernet", icon: NetworkIcon, color: "text-green-500" },
  { id: "i2c", name: "I²C", icon: Cpu, color: "text-amber-500" },
  { id: "spi", name: "SPI", icon: Cpu, color: "text-red-500" },
  { id: "can", name: "CAN / CANopen", icon: Cpu, color: "text-purple-500" },
  { id: "modbus", name: "MODBUS", icon: Gauge, color: "text-orange-500" },
  { id: "mqtt", name: "MQTT", icon: Radio, color: "text-pink-500" },
  { id: "http", name: "HTTP/HTTPS", icon: Globe, color: "text-cyan-500" },
]

// Data type options
const dataTypeOptions = [
  { value: "int8", label: "Int8 (8-bit)" },
  { value: "int16", label: "Int16 (16-bit)" },
  { value: "int32", label: "Int32 (32-bit)" },
  { value: "float", label: "Float (32-bit)" },
  { value: "double", label: "Double (64-bit)" },
  { value: "string", label: "String" },
  { value: "boolean", label: "Boolean" },
]

// Measurement options
const measurementOptions = [
  { value: "temperature", label: "Temperature" },
  { value: "humidity", label: "Humidity" },
  { value: "pressure", label: "Pressure" },
  { value: "voltage", label: "Voltage" },
  { value: "current", label: "Current" },
  { value: "flow", label: "Flow Rate" },
  { value: "level", label: "Level" },
  { value: "position", label: "Position" },
  { value: "custom", label: "Custom" },
]

// Unit options
const unitOptions = [
  { value: "celsius", label: "°C (Celsius)" },
  { value: "fahrenheit", label: "°F (Fahrenheit)" },
  { value: "kelvin", label: "K (Kelvin)" },
  { value: "percent", label: "% (Percent)" },
  { value: "pascal", label: "Pa (Pascal)" },
  { value: "bar", label: "bar" },
  { value: "psi", label: "PSI" },
  { value: "volt", label: "V (Volt)" },
  { value: "ampere", label: "A (Ampere)" },
  { value: "watt", label: "W (Watt)" },
  { value: "custom", label: "Custom" },
]

// Default data type
const defaultDataType = {
  type: "float",
  measurement: "temperature",
  unit: "celsius",
}

export function AddDeviceForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedProtocol, setSelectedProtocol] = useState("wifi")
  const [activeTab, setActiveTab] = useState("data-types")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Form state
  const [deviceName, setDeviceName] = useState("")
  const [deviceId, setDeviceId] = useState("")
  const [deviceType, setDeviceType] = useState("sensor")
  const [manufacturer, setManufacturer] = useState("")
  const [model, setModel] = useState("")
  const [firmware, setFirmware] = useState("")
  const [description, setDescription] = useState("")
  const [autoConnect, setAutoConnect] = useState(false)

  // Protocol settings state
  const [protocolSettings, setProtocolSettings] = useState({
    wifi: {
      ssid: "",
      password: "",
      ip: "",
    },
    bluetooth: {
      mac: "",
      mode: "ble",
    },
    i2c: {
      address: "",
      bus: "1",
      speed: "100000",
    },
    can: {
      interface: "can0",
      bitrate: "500000",
      nodeId: "",
    },
  })

  // Data types state
  const [dataTypes, setDataTypes] = useState([{ ...defaultDataType }])

  // Sampling state
  const [samplingRate, setSamplingRate] = useState("1")
  const [samplingUnit, setSamplingUnit] = useState("seconds")
  const [loggingInterval, setLoggingInterval] = useState("5")
  const [loggingUnit, setLoggingUnit] = useState("minutes")
  const [storageLocation, setStorageLocation] = useState("influxdb")
  const [dataCompression, setDataCompression] = useState(false)
  const [dataAggregation, setDataAggregation] = useState(false)

  // Alerts state
  const [highThreshold, setHighThreshold] = useState("")
  const [lowThreshold, setLowThreshold] = useState("")
  const [alertMethod, setAlertMethod] = useState("email")
  const [alertRecipients, setAlertRecipients] = useState("")
  const [alertEnabled, setAlertEnabled] = useState(true)

  // Form validation
  const [errors, setErrors] = useState({
    deviceName: "",
    deviceId: "",
  })

  // Add another data type
  const addDataType = () => {
    if (dataTypes.length < 10) {
      setDataTypes([...dataTypes, { ...defaultDataType }])
      toast({
        title: "Data Type Added",
        description: `Added data type ${dataTypes.length + 1}`,
      })
    } else {
      toast({
        title: "Maximum Reached",
        description: "You can add up to 10 data types per device",
        variant: "destructive",
      })
    }
  }

  // Remove a data type
  const removeDataType = (index) => {
    if (dataTypes.length > 1) {
      const newDataTypes = [...dataTypes]
      newDataTypes.splice(index, 1)
      setDataTypes(newDataTypes)
      toast({
        title: "Data Type Removed",
        description: `Removed data type ${index + 1}`,
      })
    } else {
      toast({
        title: "Cannot Remove",
        description: "Device must have at least one data type",
        variant: "destructive",
      })
    }
  }

  // Update a data type
  const updateDataType = (index, field, value) => {
    const newDataTypes = [...dataTypes]
    newDataTypes[index] = {
      ...newDataTypes[index],
      [field]: value,
    }
    setDataTypes(newDataTypes)
  }

  // Handle protocol settings change
  const updateProtocolSetting = (protocol, field, value) => {
    setProtocolSettings({
      ...protocolSettings,
      [protocol]: {
        ...protocolSettings[protocol],
        [field]: value,
      },
    })
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {
      deviceName: "",
      deviceId: "",
    }

    let isValid = true

    if (!deviceName.trim()) {
      newErrors.deviceName = "Device name is required"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create device object
      const device = {
        id: deviceId || `device-${Date.now()}`,
        name: deviceName,
        type: deviceType,
        manufacturer,
        model,
        firmware,
        description,
        autoConnect,
        protocol: selectedProtocol,
        protocolSettings: protocolSettings[selectedProtocol],
        dataTypes,
        sampling: {
          rate: samplingRate,
          unit: samplingUnit,
          loggingInterval,
          loggingUnit,
          storageLocation,
          compression: dataCompression,
          aggregation: dataAggregation,
        },
        alerts: {
          highThreshold,
          lowThreshold,
          method: alertMethod,
          recipients: alertRecipients,
          enabled: alertEnabled,
        },
        status: "offline",
        createdAt: new Date().toISOString(),
      }

      // Log the device (in a real app, this would be saved to a database)
      console.log("New device:", device)

      toast({
        title: "Device Added",
        description: `${deviceName} has been added successfully`,
      })

      // Redirect to devices page
      router.push("/devices")
    } catch (error) {
      console.error("Error adding device:", error)
      toast({
        title: "Error",
        description: "Failed to add device. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setShowCancelDialog(true)
  }

  // Confirm cancel
  const confirmCancel = () => {
    router.push("/devices")
    toast({
      title: "Cancelled",
      description: "Device addition cancelled",
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Device Information</CardTitle>
          <CardDescription>Enter the basic information about your device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">
                Device Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="device-name"
                placeholder="Enter device name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className={errors.deviceName ? "border-red-500" : ""}
              />
              {errors.deviceName && <p className="text-red-500 text-sm">{errors.deviceName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-id">Device ID</Label>
              <Input
                id="device-id"
                placeholder="Enter device ID or leave blank to auto-generate"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className={errors.deviceId ? "border-red-500" : ""}
              />
              {errors.deviceId && <p className="text-red-500 text-sm">{errors.deviceId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device-type">Device Type</Label>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger id="device-type">
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sensor">Sensor</SelectItem>
                  <SelectItem value="actuator">Actuator</SelectItem>
                  <SelectItem value="controller">Controller</SelectItem>
                  <SelectItem value="gateway">Gateway</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                placeholder="Enter manufacturer name"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="Enter model number"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firmware">Firmware Version</Label>
              <Input
                id="firmware"
                placeholder="Enter firmware version"
                value={firmware}
                onChange={(e) => setFirmware(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter device description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="auto-connect" checked={autoConnect} onCheckedChange={setAutoConnect} />
            <Label htmlFor="auto-connect">Auto-connect on startup</Label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Communication Protocol</CardTitle>
            <CardDescription>Select the protocol used by this device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {protocols.map((protocol) => (
                <Button
                  key={protocol.id}
                  variant={selectedProtocol === protocol.id ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-24 px-2 py-3"
                  onClick={() => setSelectedProtocol(protocol.id)}
                >
                  <protocol.icon className={`h-8 w-8 mb-2 ${protocol.color}`} />
                  <span className="text-xs text-center">{protocol.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Protocol Settings</CardTitle>
            <CardDescription>Configure protocol-specific settings</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProtocol === "wifi" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wifi-ssid">SSID</Label>
                  <Input
                    id="wifi-ssid"
                    placeholder="Enter Wi-Fi SSID"
                    value={protocolSettings.wifi.ssid}
                    onChange={(e) => updateProtocolSetting("wifi", "ssid", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi-password">Password</Label>
                  <Input
                    id="wifi-password"
                    type="password"
                    placeholder="Enter Wi-Fi password"
                    value={protocolSettings.wifi.password}
                    onChange={(e) => updateProtocolSetting("wifi", "password", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi-ip">IP Address</Label>
                  <Input
                    id="wifi-ip"
                    placeholder="Enter IP address or use DHCP"
                    value={protocolSettings.wifi.ip}
                    onChange={(e) => updateProtocolSetting("wifi", "ip", e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedProtocol === "bluetooth" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bt-mac">MAC Address</Label>
                  <Input
                    id="bt-mac"
                    placeholder="Enter Bluetooth MAC address"
                    value={protocolSettings.bluetooth.mac}
                    onChange={(e) => updateProtocolSetting("bluetooth", "mac", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bt-mode">Mode</Label>
                  <Select
                    value={protocolSettings.bluetooth.mode}
                    onValueChange={(value) => updateProtocolSetting("bluetooth", "mode", value)}
                  >
                    <SelectTrigger id="bt-mode">
                      <SelectValue placeholder="Select Bluetooth mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Bluetooth Classic</SelectItem>
                      <SelectItem value="ble">Bluetooth Low Energy (BLE)</SelectItem>
                      <SelectItem value="dual">Dual Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedProtocol === "i2c" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="i2c-address">I2C Address</Label>
                  <Input
                    id="i2c-address"
                    placeholder="Enter I2C address (hex)"
                    value={protocolSettings.i2c.address}
                    onChange={(e) => updateProtocolSetting("i2c", "address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="i2c-bus">Bus</Label>
                  <Select
                    value={protocolSettings.i2c.bus}
                    onValueChange={(value) => updateProtocolSetting("i2c", "bus", value)}
                  >
                    <SelectTrigger id="i2c-bus">
                      <SelectValue placeholder="Select I2C bus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Bus 0</SelectItem>
                      <SelectItem value="1">Bus 1</SelectItem>
                      <SelectItem value="2">Bus 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="i2c-speed">Speed</Label>
                  <Select
                    value={protocolSettings.i2c.speed}
                    onValueChange={(value) => updateProtocolSetting("i2c", "speed", value)}
                  >
                    <SelectTrigger id="i2c-speed">
                      <SelectValue placeholder="Select I2C speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100000">100 kHz (Standard)</SelectItem>
                      <SelectItem value="400000">400 kHz (Fast)</SelectItem>
                      <SelectItem value="1000000">1 MHz (Fast Plus)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedProtocol === "can" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="can-interface">CAN Interface</Label>
                  <Select
                    value={protocolSettings.can.interface}
                    onValueChange={(value) => updateProtocolSetting("can", "interface", value)}
                  >
                    <SelectTrigger id="can-interface">
                      <SelectValue placeholder="Select CAN interface" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="can0">can0</SelectItem>
                      <SelectItem value="can1">can1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="can-bitrate">Bitrate</Label>
                  <Select
                    value={protocolSettings.can.bitrate}
                    onValueChange={(value) => updateProtocolSetting("can", "bitrate", value)}
                  >
                    <SelectTrigger id="can-bitrate">
                      <SelectValue placeholder="Select CAN bitrate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="125000">125 kbit/s</SelectItem>
                      <SelectItem value="250000">250 kbit/s</SelectItem>
                      <SelectItem value="500000">500 kbit/s</SelectItem>
                      <SelectItem value="1000000">1 Mbit/s</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="can-id">Node ID</Label>
                  <Input
                    id="can-id"
                    placeholder="Enter CAN node ID"
                    value={protocolSettings.can.nodeId}
                    onChange={(e) => updateProtocolSetting("can", "nodeId", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Other protocol settings would go here */}
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Data Configuration</CardTitle>
          <CardDescription>Configure how data is processed and stored</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="data-types">Data Types</TabsTrigger>
              <TabsTrigger value="sampling">Sampling & Logging</TabsTrigger>
              <TabsTrigger value="alerts">Alerts & Thresholds</TabsTrigger>
            </TabsList>

            <TabsContent value="data-types" className="space-y-6 pt-4">
              {dataTypes.map((dataType, index) => (
                <div key={index} className="space-y-4">
                  {index > 0 && <div className="border-t border-gray-200 dark:border-gray-800 pt-4"></div>}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Data Type {index + 1}</h3>
                    {dataTypes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDataType(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`data-type-${index}`}>Data Type</Label>
                      <Select value={dataType.type} onValueChange={(value) => updateDataType(index, "type", value)}>
                        <SelectTrigger id={`data-type-${index}`}>
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`measurement-${index}`}>Measurement</Label>
                      <Select
                        value={dataType.measurement}
                        onValueChange={(value) => updateDataType(index, "measurement", value)}
                      >
                        <SelectTrigger id={`measurement-${index}`}>
                          <SelectValue placeholder="Select measurement type" />
                        </SelectTrigger>
                        <SelectContent>
                          {measurementOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`unit-${index}`}>Unit</Label>
                      <Select value={dataType.unit} onValueChange={(value) => updateDataType(index, "unit", value)}>
                        <SelectTrigger id={`unit-${index}`}>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addDataType}
                className="mt-4"
                disabled={dataTypes.length >= 10}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Another Data Type
              </Button>
              {dataTypes.length >= 10 && (
                <p className="text-sm text-amber-500 flex items-center mt-2">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Maximum of 10 data types reached
                </p>
              )}
            </TabsContent>

            <TabsContent value="sampling" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sampling-rate">Sampling Rate</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sampling-rate"
                      type="number"
                      value={samplingRate}
                      onChange={(e) => setSamplingRate(e.target.value)}
                      min="0.001"
                      step="0.001"
                      className="flex-1"
                    />
                    <Select value={samplingUnit} onValueChange={setSamplingUnit}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milliseconds">Milliseconds</SelectItem>
                        <SelectItem value="seconds">Seconds</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logging-interval">Logging Interval</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logging-interval"
                      type="number"
                      value={loggingInterval}
                      onChange={(e) => setLoggingInterval(e.target.value)}
                      min="1"
                      className="flex-1"
                    />
                    <Select value={loggingUnit} onValueChange={setLoggingUnit}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seconds">Seconds</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage-location">Storage Location</Label>
                <Select value={storageLocation} onValueChange={setStorageLocation}>
                  <SelectTrigger id="storage-location">
                    <SelectValue placeholder="Select storage location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="influxdb">InfluxDB</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                    <SelectItem value="sqlite">SQLite</SelectItem>
                    <SelectItem value="csv">CSV Files</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="data-compression" checked={dataCompression} onCheckedChange={setDataCompression} />
                <Label htmlFor="data-compression">Enable data compression</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="data-aggregation" checked={dataAggregation} onCheckedChange={setDataAggregation} />
                <Label htmlFor="data-aggregation">Enable data aggregation</Label>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="high-threshold">High Threshold</Label>
                  <Input
                    id="high-threshold"
                    type="number"
                    placeholder="Enter high threshold value"
                    value={highThreshold}
                    onChange={(e) => setHighThreshold(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low-threshold">Low Threshold</Label>
                  <Input
                    id="low-threshold"
                    type="number"
                    placeholder="Enter low threshold value"
                    value={lowThreshold}
                    onChange={(e) => setLowThreshold(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-method">Alert Method</Label>
                <Select value={alertMethod} onValueChange={setAlertMethod}>
                  <SelectTrigger id="alert-method">
                    <SelectValue placeholder="Select alert method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="mqtt">MQTT</SelectItem>
                    <SelectItem value="dashboard">Dashboard Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-recipients">Recipients</Label>
                <Input
                  id="alert-recipients"
                  placeholder="Enter email addresses or phone numbers"
                  value={alertRecipients}
                  onChange={(e) => setAlertRecipients(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="alert-enabled" checked={alertEnabled} onCheckedChange={setAlertEnabled} />
                <Label htmlFor="alert-enabled">Enable alerts</Label>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Device"}
          </Button>
        </CardFooter>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Device Addition</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? All entered information will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              No, Continue Editing
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
