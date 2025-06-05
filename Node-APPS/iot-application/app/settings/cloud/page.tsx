import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud } from "lucide-react"

export default function SettingsCloudPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Cloud & Database Setup</h1>
        <Cloud className="h-6 w-6 text-blue-500" />
      </div>
      <p className="text-muted-foreground">Configure cloud services and database connections</p>

      <Card>
        <CardHeader>
          <CardTitle>Cloud Configuration</CardTitle>
          <CardDescription>Connect to cloud services and databases</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to configure connections to cloud services and databases for your system.</p>
        </CardContent>
      </Card>
    </div>
  )
}
