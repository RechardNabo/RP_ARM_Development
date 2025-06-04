import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export function DatabaseSettings() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Database Settings</CardTitle>
        <CardDescription>Configure data storage options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="db-type">Database Type</Label>
          <Select defaultValue="influxdb">
            <SelectTrigger id="db-type">
              <SelectValue placeholder="Select database type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="influxdb">InfluxDB</SelectItem>
              <SelectItem value="mongodb">MongoDB</SelectItem>
              <SelectItem value="sqlite">SQLite</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="db-host">Host</Label>
          <Input id="db-host" defaultValue="localhost" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="db-port">Port</Label>
          <Input id="db-port" defaultValue="8086" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="db-name">Database Name</Label>
          <Input id="db-name" defaultValue="cm4_iot_data" />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="db-auth">Authentication</Label>
          <Switch id="db-auth" defaultChecked />
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" className="mr-2">
            Test Connection
          </Button>
          <Button size="sm">Save</Button>
        </div>
      </CardContent>
    </Card>
  )
}
