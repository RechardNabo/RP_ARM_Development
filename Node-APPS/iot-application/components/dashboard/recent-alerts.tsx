import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export function RecentAlerts() {
  const alerts = [
    {
      id: 1,
      title: "CAN0 Interface Down",
      description: "CAN0 interface is not responding",
      time: "10 minutes ago",
      severity: "high",
      icon: AlertTriangle,
      color: "text-red-500",
      badge: "bg-red-500",
    },
    {
      id: 2,
      title: "Temperature Sensor Warning",
      description: "Temperature above threshold (42°C)",
      time: "25 minutes ago",
      severity: "medium",
      icon: AlertCircle,
      color: "text-amber-500",
      badge: "bg-amber-500",
    },
    {
      id: 3,
      title: "New Device Connected",
      description: "Temperature sensor connected via I2C",
      time: "1 hour ago",
      severity: "info",
      icon: Info,
      color: "text-blue-500",
      badge: "bg-blue-500",
    },
    {
      id: 4,
      title: "System Update Available",
      description: "New firmware update available",
      time: "3 hours ago",
      severity: "info",
      icon: Info,
      color: "text-blue-500",
      badge: "bg-blue-500",
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Alerts</CardTitle>
        <CardDescription>Latest system and device alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[220px] pr-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                <div className={`mt-0.5 ${alert.color}`}>
                  <alert.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{alert.title}</h4>
                    <Badge className={alert.badge}>{alert.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
