import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Radio } from "lucide-react"

export default function LogsProtocolsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Protocol-Specific Logs</h1>
        <Radio className="h-6 w-6 text-purple-500" />
      </div>
      <p className="text-muted-foreground">View logs specific to each communication protocol</p>

      <Card>
        <CardHeader>
          <CardTitle>Protocol Logs</CardTitle>
          <CardDescription>Detailed logs for each communication protocol</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page displays detailed logs specific to each communication protocol used in your system.</p>
        </CardContent>
      </Card>
    </div>
  )
}
