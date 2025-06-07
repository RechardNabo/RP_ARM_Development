import { Wifi, Bluetooth, NetworkIcon as Ethernet } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="bg-slate-800 text-white">
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">CM4-IO-WIRELESS IoT Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Wifi className="h-5 w-5 text-green-400" />
              <span className="text-sm">Connected</span>
            </div>
            <div className="flex items-center gap-1">
              <Bluetooth className="h-5 w-5 text-green-400" />
              <span className="text-sm">Active</span>
            </div>
            <div className="flex items-center gap-1">
              <Ethernet className="h-5 w-5 text-green-400" />
              <span className="text-sm">Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
