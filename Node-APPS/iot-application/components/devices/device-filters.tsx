"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"

export type DeviceFilters = {
  search: string
  status: {
    online: boolean
    offline: boolean
    warning: boolean
    error: boolean
  }
  protocol: {
    wifi: boolean
    bluetooth: boolean
    ethernet: boolean
    i2c: boolean
    spi: boolean
    can: boolean
    modbus: boolean
    mqtt: boolean
  }
  deviceType: "all" | "sensor" | "actuator" | "controller" | "gateway"
}

const defaultFilters: DeviceFilters = {
  search: "",
  status: {
    online: true,
    offline: false,
    warning: false,
    error: false,
  },
  protocol: {
    wifi: true,
    bluetooth: true,
    ethernet: true,
    i2c: true,
    spi: true,
    can: true,
    modbus: true,
    mqtt: true,
  },
  deviceType: "all",
}

export function DeviceFilters({
  onFiltersChange,
}: {
  onFiltersChange: (filters: DeviceFilters) => void
}) {
  const { toast } = useToast()
  const [filters, setFilters] = useState<DeviceFilters>(defaultFilters)
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)
  const [isResetting, setIsResetting] = useState(false)

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearch !== filters.search) {
        setFilters((prev) => ({ ...prev, search: debouncedSearch }))
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [debouncedSearch, filters.search])

  // Notify parent component when filters change
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  // Handle status checkbox changes
  const handleStatusChange = (key: keyof DeviceFilters["status"], checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      status: {
        ...prev.status,
        [key]: checked,
      },
    }))
  }

  // Handle protocol checkbox changes
  const handleProtocolChange = (key: keyof DeviceFilters["protocol"], checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        [key]: checked,
      },
    }))
  }

  // Handle device type radio changes
  const handleDeviceTypeChange = (value: DeviceFilters["deviceType"]) => {
    setFilters((prev) => ({
      ...prev,
      deviceType: value,
    }))
  }

  // Reset filters to default
  const handleReset = () => {
    setIsResetting(true)
    setDebouncedSearch(defaultFilters.search)
    setFilters(defaultFilters)

    toast({
      title: "Filters Reset",
      description: "Device filters have been reset to default values.",
    })

    setTimeout(() => setIsResetting(false), 500)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center">
          <span>Filters</span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Reset all filters" onClick={handleReset}>
            <RefreshCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
            <span className="sr-only">Reset filters</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search devices..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Status</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-online"
                checked={filters.status.online}
                onCheckedChange={(checked) => handleStatusChange("online", checked as boolean)}
              />
              <label htmlFor="status-online" className="text-sm">
                Online
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-offline"
                checked={filters.status.offline}
                onCheckedChange={(checked) => handleStatusChange("offline", checked as boolean)}
              />
              <label htmlFor="status-offline" className="text-sm">
                Offline
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-warning"
                checked={filters.status.warning}
                onCheckedChange={(checked) => handleStatusChange("warning", checked as boolean)}
              />
              <label htmlFor="status-warning" className="text-sm">
                Warning
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-error"
                checked={filters.status.error}
                onCheckedChange={(checked) => handleStatusChange("error", checked as boolean)}
              />
              <label htmlFor="status-error" className="text-sm">
                Error
              </label>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Protocol</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="protocol-wifi"
                checked={filters.protocol.wifi}
                onCheckedChange={(checked) => handleProtocolChange("wifi", checked as boolean)}
              />
              <label htmlFor="protocol-wifi" className="text-sm">
                Wi-Fi
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="protocol-bluetooth"
                checked={filters.protocol.bluetooth}
                onCheckedChange={(checked) => handleProtocolChange("bluetooth", checked as boolean)}
              />
              <label htmlFor="protocol-bluetooth" className="text-sm">
                Bluetooth
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="protocol-ethernet"
                checked={filters.protocol.ethernet}
                onCheckedChange={(checked) => handleProtocolChange("ethernet", checked as boolean)}
              />
              <label htmlFor="protocol-ethernet" className="text-sm">
                Ethernet
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="protocol-i2c"
                checked={filters.protocol.i2c}
                onCheckedChange={(checked) => handleProtocolChange("i2c", checked as boolean)}
              />
              <label htmlFor="protocol-i2c" className="text-sm">
                I2C
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="protocol-spi"
                checked={filters.protocol.spi}
                onCheckedChange={(checked) => handleProtocolChange("spi", checked as boolean)}
              />
              <label htmlFor="protocol-spi" className="text-sm">
                SPI
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="protocol-can"
                checked={filters.protocol.can}
                onCheckedChange={(checked) => handleProtocolChange("can", checked as boolean)}
              />
              <label htmlFor="protocol-can" className="text-sm">
                CAN
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="protocol-modbus"
                checked={filters.protocol.modbus}
                onCheckedChange={(checked) => handleProtocolChange("modbus", checked as boolean)}
              />
              <label htmlFor="protocol-modbus" className="text-sm">
                MODBUS
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="protocol-mqtt"
                checked={filters.protocol.mqtt}
                onCheckedChange={(checked) => handleProtocolChange("mqtt", checked as boolean)}
              />
              <label htmlFor="protocol-mqtt" className="text-sm">
                MQTT
              </label>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Device Type</h3>
          <RadioGroup
            value={filters.deviceType}
            onValueChange={(value) => handleDeviceTypeChange(value as DeviceFilters["deviceType"])}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="type-all" />
              <label htmlFor="type-all" className="text-sm">
                All
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sensor" id="type-sensor" />
              <label htmlFor="type-sensor" className="text-sm">
                Sensors
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="actuator" id="type-actuator" />
              <label htmlFor="type-actuator" className="text-sm">
                Actuators
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="controller" id="type-controller" />
              <label htmlFor="type-controller" className="text-sm">
                Controllers
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gateway" id="type-gateway" />
              <label htmlFor="type-gateway" className="text-sm">
                Gateways
              </label>
            </div>
          </RadioGroup>
        </div>

        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
            Reset All Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
