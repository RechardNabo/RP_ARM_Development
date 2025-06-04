import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Radio } from "lucide-react"

export default function LiveDataProtocolsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Protocol Monitoring</h1>
        <Radio className="h-6 w-6 text-purple-500" />
      </div>
      <p className="text-muted-foreground">Monitor data across different communication protocols</p>

      <Card>
        <CardHeader>
          <CardTitle>Protocol Data</CardTitle>
          <CardDescription>Real-time data monitoring by protocol</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page displays real-time data organized by communication protocol.</p>
        </CardContent>
      </Card>
    </div>
  )
}
