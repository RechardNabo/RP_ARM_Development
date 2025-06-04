import { LiveDataHeader } from "@/components/live-data/live-data-header"
import { LiveDataCharts } from "@/components/live-data/live-data-charts"
import { LiveDataDevices } from "@/components/live-data/live-data-devices"
import { LiveDataControls } from "@/components/live-data/live-data-controls"

export default function LiveDataPage() {
  return (
    <div className="p-6 space-y-6">
      <LiveDataHeader />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <LiveDataCharts />
        </div>
        <div className="space-y-6">
          <LiveDataDevices />
          <LiveDataControls />
        </div>
      </div>
    </div>
  )
}
