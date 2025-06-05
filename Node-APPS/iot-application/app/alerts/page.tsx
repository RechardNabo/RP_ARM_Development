import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AlertsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">Monitor and manage system alerts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Currently active system alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page is under construction. Alert management features will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
