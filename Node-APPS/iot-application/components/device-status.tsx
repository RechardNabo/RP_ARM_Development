import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CirclePower, Cpu, Thermometer, Activity } from "lucide-react"

export function DeviceStatus() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Device Status</CardTitle>
          <Badge className="bg-green-500">Online</Badge>
        </div>
        <CardDescription>CM4-IO-WIRELESS-BASE with Raspberry Pi CM4</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <CirclePower className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Power</span>
            </div>
            <span className="text-sm">5V / 3A</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">CPU Usage</span>
            </div>
            <span className="text-sm">23%</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Temperature</span>
            </div>
            <span className="text-sm">42°C</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Network Activity</span>
            </div>
            <span className="text-sm">2.3 MB/s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
