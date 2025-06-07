import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function DashboardActiveAlertsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Active Alerts</h1>
        <AlertTriangle className="h-6 w-6 text-amber-500" />
      </div>
      <p className="text-muted-foreground">View and manage currently active system alerts</p>

      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>Critical and warning alerts that require attention</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page displays active alerts from your CM4-IO-WIRELESS-BASE system.</p>
        </CardContent>
      </Card>
    </div>
  )
}
