import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Thermometer, Gauge, Wifi, Bluetooth, NetworkIcon, Cpu, Activity } from "lucide-react"

export function LiveDataDevices() {
  const devices = [
    {
      id: "dev-001",
      name: "Temperature Sensor",
      type: "sensor",
      protocol: "I2C",
      status: "online",
      value: "24.5°C",
      icon: Thermometer,
      iconColor: "text-red-500",
    },
    {
      id: "dev-002",
      name: "Pressure Sensor",
      type: "sensor",
      protocol: "SPI",
      status: "online",
      value: "1013.2 hPa",
      icon: Gauge,
      iconColor: "text-blue-500",
    },
    {
      id: "dev-003",
      name: "Smart Light Controller",
      type: "actuator",
      protocol: "Wi-Fi",
      status: "online",
      value: "On (75%)",
      icon: Wifi,
      iconColor: "text-amber-500",
    },
    {
      id: "dev-004",
      name: "Motor Controller",
      type: "actuator",
      protocol: "CAN",
      status: "offline",
      value: "Off",
      icon: Cpu,
      iconColor: "text-gray-500",
    },
    {
      id: "dev-005",
      name: "Gateway Node",
      type: "gateway",
      protocol: "Ethernet",
      status: "warning",
      value: "Active",
      icon: NetworkIcon,
      iconColor: "text-green-500",
    },
    {
      id: "dev-006",
      name: "Bluetooth Beacon",
      type: "sensor",
      protocol: "Bluetooth",
      status: "online",
      value: "Connected",
      icon: Bluetooth,
      iconColor: "text-indigo-500",
    },
    {
      id: "dev-007",
      name: "Flow Sensor",
      type: "sensor",
      protocol: "MODBUS",
      status: "warning",
      value: "2.3 L/min",
      icon: Activity,
      iconColor: "text-purple-500",
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Active Devices</CardTitle>
        <CardDescription>Select devices to display on chart</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id={device.id} defaultChecked={device.status === "online"} />
                  <label htmlFor={device.id} className="flex items-center gap-2 text-sm">
                    <device.icon className={`h-4 w-4 ${device.iconColor}`} />
                    {device.name}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{device.value}</span>
                  <Badge
                    className={
                      device.status === "online"
                        ? "bg-green-500"
                        : device.status === "warning"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }
                  >
                    {device.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
