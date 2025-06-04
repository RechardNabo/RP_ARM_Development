import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle } from "lucide-react"
import { DeviceHealthOverview } from "@/components/devices/health/device-health-overview"
import { DeviceHealthFilters } from "@/components/devices/health/device-health-filters"
import { DeviceHealthMetrics } from "@/components/devices/health/device-health-metrics"
import { DeviceHealthAlerts } from "@/components/devices/health/device-health-alerts"
import { DeviceHealthDiagnostics } from "@/components/devices/health/device-health-diagnostics"
import { Skeleton } from "@/components/ui/skeleton"

export default function DevicesHealthPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Device Health</h1>
          <Activity className="h-6 w-6 text-green-500" />
        </div>
        <DeviceHealthFilters />
      </div>
      <p className="text-muted-foreground">Monitor the health status of all connected devices</p>

      <Suspense fallback={<Skeleton className="w-full h-[200px] rounded-lg" />}>
        <DeviceHealthOverview />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Health Metrics</CardTitle>
            <CardDescription>Performance and status metrics for your devices</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="w-full h-[300px] rounded-lg" />}>
              <DeviceHealthMetrics />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Alerts</CardTitle>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <CardDescription>Issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="w-full h-[300px] rounded-lg" />}>
              <DeviceHealthAlerts />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Diagnostics</CardTitle>
          <CardDescription>Detailed diagnostics and troubleshooting tools</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="w-full h-[400px] rounded-lg" />}>
            <DeviceHealthDiagnostics />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
