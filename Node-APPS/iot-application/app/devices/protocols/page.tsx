import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Radio } from "lucide-react"

export default function DevicesProtocolsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Protocol Settings</h1>
        <Radio className="h-6 w-6 text-purple-500" />
      </div>
      <p className="text-muted-foreground">Configure communication protocol settings</p>

      <Card>
        <CardHeader>
          <CardTitle>Communication Protocols</CardTitle>
          <CardDescription>Configure protocol-specific settings for your devices</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to configure settings for various communication protocols used by your devices.</p>
        </CardContent>
      </Card>
    </div>
  )
}
