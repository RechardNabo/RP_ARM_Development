import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wifi, Bluetooth, NetworkIcon, Cpu, Thermometer, Gauge } from "lucide-react"

export function DeviceOverview() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Device Overview</CardTitle>
        <CardDescription>Connected devices by protocol</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Wi-Fi</span>
            </div>
            <span className="text-sm">5 devices</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bluetooth className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium">Bluetooth</span>
            </div>
            <span className="text-sm">3 devices</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <NetworkIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Ethernet</span>
            </div>
            <span className="text-sm">2 devices</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">I2C</span>
            </div>
            <span className="text-sm">4 devices</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">SPI</span>
            </div>
            <span className="text-sm">2 devices</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Sensors</span>
            </div>
            <span className="text-sm">8 devices</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
