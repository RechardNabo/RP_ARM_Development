import { Button } from "@/components/ui/button"
import { Download, RefreshCw, Settings } from "lucide-react"

export function LiveDataHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Data</h1>
        <p className="text-muted-foreground">Real-time monitoring of device data</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-9">
          <Settings className="mr-2 h-4 w-4" />
          Configure
        </Button>
        <Button variant="outline" size="sm" className="h-9">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button size="sm" className="h-9">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  )
}
