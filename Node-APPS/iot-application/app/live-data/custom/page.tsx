import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard } from "lucide-react"

export default function LiveDataCustomPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Custom Dashboards</h1>
        <LayoutDashboard className="h-6 w-6 text-indigo-500" />
      </div>
      <p className="text-muted-foreground">Create and view custom data dashboards</p>

      <Card>
        <CardHeader>
          <CardTitle>Custom Dashboard Builder</CardTitle>
          <CardDescription>Create personalized dashboards for your data</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to create and manage custom dashboards for visualizing your device data.</p>
        </CardContent>
      </Card>
    </div>
  )
}
