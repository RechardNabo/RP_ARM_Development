import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HelpPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">Get help with using the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
          <CardDescription>Learn how to use the CM4 IoT Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page is under construction. Documentation and help resources will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
