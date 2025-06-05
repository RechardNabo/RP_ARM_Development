import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { History } from "lucide-react"

export default function LiveDataHistoricalPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Historical Trends</h1>
        <History className="h-6 w-6 text-blue-500" />
      </div>
      <p className="text-muted-foreground">View historical data trends and patterns</p>

      <Card>
        <CardHeader>
          <CardTitle>Historical Data</CardTitle>
          <CardDescription>Long-term data trends and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page displays historical data trends and patterns from your connected devices.</p>
        </CardContent>
      </Card>
    </div>
  )
}
