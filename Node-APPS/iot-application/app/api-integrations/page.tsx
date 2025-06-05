import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApiIntegrationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API & Integrations</h1>
        <p className="text-muted-foreground">Manage API keys and third-party integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage API access to your system</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page is under construction. API management features will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
