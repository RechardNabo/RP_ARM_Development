import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe } from "lucide-react"

export default function ApiIntegrationsServicesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Third-Party Services</h1>
        <Globe className="h-6 w-6 text-green-500" />
      </div>
      <p className="text-muted-foreground">Connect and configure third-party service integrations</p>

      <Card>
        <CardHeader>
          <CardTitle>Service Integrations</CardTitle>
          <CardDescription>Connect to external services and platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to configure connections to third-party services and platforms.</p>
        </CardContent>
      </Card>
    </div>
  )
}
