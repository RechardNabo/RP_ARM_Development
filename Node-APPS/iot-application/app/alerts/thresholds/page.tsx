import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gauge } from "lucide-react"

export default function AlertsThresholdsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Threshold Settings</h1>
        <Gauge className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-muted-foreground">Configure alert thresholds and trigger conditions</p>

      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
          <CardDescription>Configure when alerts should be triggered</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to configure threshold values that trigger alerts in your system.</p>
        </CardContent>
      </Card>
    </div>
  )
}
