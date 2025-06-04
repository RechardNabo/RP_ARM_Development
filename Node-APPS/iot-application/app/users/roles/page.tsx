import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function UsersRolesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
        <Shield className="h-6 w-6 text-blue-500" />
      </div>
      <p className="text-muted-foreground">Manage user roles and permissions</p>

      <Card>
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
          <CardDescription>Define and manage user roles</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to create and manage user roles with different permission levels.</p>
        </CardContent>
      </Card>
    </div>
  )
}
