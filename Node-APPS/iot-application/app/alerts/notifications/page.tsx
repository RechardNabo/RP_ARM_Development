import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

export default function AlertsNotificationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <Bell className="h-6 w-6 text-blue-500" />
      </div>
      <p className="text-muted-foreground">Configure how and where alerts are delivered</p>

      <Card>
        <CardHeader>
          <CardTitle>Alert Notifications</CardTitle>
          <CardDescription>Configure notification methods and recipients</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to configure how alerts are delivered and who receives them.</p>
        </CardContent>
      </Card>
    </div>
  )
}
