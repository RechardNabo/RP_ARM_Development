import { Button } from "@/components/ui/button"
import { Save, RotateCcw } from "lucide-react"

export function SettingsHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure communication protocols and system preferences</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-9">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button size="sm" className="h-9">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
