import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CirclePower, Cpu, Thermometer, MemoryStickIcon as Memory, HardDrive } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function SystemStatus() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>System Status</CardTitle>
          <Badge className="bg-green-500">Healthy</Badge>
        </div>
        <CardDescription>CM4-IO-WIRELESS-BASE with Raspberry Pi CM4</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm">23%</span>
            </div>
            <Progress value={23} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Memory className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <span className="text-sm">1.2 GB / 4 GB</span>
            </div>
            <Progress value={30} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <span className="text-sm">12.4 GB / 32 GB</span>
            </div>
            <Progress value={38} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <span className="text-sm">42°C</span>
            </div>
            <Progress value={42} className="h-2" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <CirclePower className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <span className="text-sm">3d 14h 22m</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
