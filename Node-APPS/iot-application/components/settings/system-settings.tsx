import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function SystemSettings() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>System Settings</CardTitle>
        <CardDescription>Configure system behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="system-name">System Name</Label>
          <Input id="system-name" defaultValue="CM4-IoT-Gateway" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="log-level">Log Level</Label>
          <Select defaultValue="info">
            <SelectTrigger id="log-level">
              <SelectValue placeholder="Select log level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-start">Auto-start on boot</Label>
            <Switch id="auto-start" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-update">Auto-update firmware</Label>
            <Switch id="auto-update" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="watchdog">Enable watchdog timer</Label>
            <Switch id="watchdog" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="power-save">Power saving mode</Label>
            <Switch id="power-save" />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button size="sm">Apply</Button>
        </div>
      </CardContent>
    </Card>
  )
}
