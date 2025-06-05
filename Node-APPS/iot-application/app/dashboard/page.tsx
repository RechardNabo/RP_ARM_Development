import { SystemStatus } from "@/components/dashboard/system-status"
import { DeviceOverview } from "@/components/dashboard/device-overview"
import { ServiceMonitor } from "@/components/dashboard/service-monitor"
import { RecentAlerts } from "@/components/dashboard/recent-alerts"
import { NetworkStatus } from "@/components/dashboard/network-status"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { HardwareStatus } from "@/components/dashboard/hardware-status"

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <DashboardHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SystemStatus />
        <ServiceMonitor />
        <RecentAlerts />
      </div>

      <HardwareStatus />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts />
        </div>
        <div className="space-y-6">
          <DeviceOverview />
          <NetworkStatus />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
