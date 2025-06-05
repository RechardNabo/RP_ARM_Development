import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NetworkIcon } from "lucide-react"

export default function DashboardNetworkStatusPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Network Status</h1>
        <NetworkIcon className="h-6 w-6 text-green-500" />
      </div>
      <p className="text-muted-foreground">Monitor the status of all network connections</p>

      <Card>
        <CardHeader>
          <CardTitle>Network Overview</CardTitle>
          <CardDescription>Status of all network interfaces and connections</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page displays detailed network status information for your CM4-IO-WIRELESS-BASE system.</p>
        </CardContent>
      </Card>
    </div>
  )
}
