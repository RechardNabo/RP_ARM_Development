import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "lucide-react"

export default function ApiIntegrationsWebhooksPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <Link className="h-6 w-6 text-blue-500" />
      </div>
      <p className="text-muted-foreground">Configure and manage webhooks for external integrations</p>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>Set up webhooks for event notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to configure webhooks to notify external systems about events in your system.</p>
        </CardContent>
      </Card>
    </div>
  )
}
