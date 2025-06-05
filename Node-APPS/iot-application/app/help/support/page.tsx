import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeBuoy } from "lucide-react"

export default function HelpSupportPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
        <LifeBuoy className="h-6 w-6 text-blue-500" />
      </div>
      <p className="text-muted-foreground">Create and manage support tickets</p>

      <Card>
        <CardHeader>
          <CardTitle>Support System</CardTitle>
          <CardDescription>Get help with your CM4 IoT Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to create and manage support tickets for assistance with your system.</p>
        </CardContent>
      </Card>
    </div>
  )
}
