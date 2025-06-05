import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

export default function DashboardLocationMapPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Location Map</h1>
        <MapPin className="h-6 w-6 text-blue-500" />
      </div>
      <p className="text-muted-foreground">View device locations and deployment map</p>

      <Card>
        <CardHeader>
          <CardTitle>Device Locations</CardTitle>
          <CardDescription>Geographic distribution of connected devices</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page displays a map showing the locations of all your connected devices.</p>
        </CardContent>
      </Card>
    </div>
  )
}
