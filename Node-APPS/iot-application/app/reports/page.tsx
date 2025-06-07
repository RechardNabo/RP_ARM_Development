import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and view system reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>Create custom reports from your data</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page is under construction. Report generation features will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
