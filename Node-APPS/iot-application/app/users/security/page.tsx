import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

export default function UsersSecurityPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Security & Permissions</h1>
        <Lock className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-muted-foreground">Configure security settings and access permissions</p>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Configure system security and access controls</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to configure security settings and access permissions for your system.</p>
        </CardContent>
      </Card>
    </div>
  )
}
