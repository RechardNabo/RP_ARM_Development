import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function HelpCommunityPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Community Forum</h1>
        <Users className="h-6 w-6 text-green-500" />
      </div>
      <p className="text-muted-foreground">Connect with other users in the community forum</p>

      <Card>
        <CardHeader>
          <CardTitle>Community</CardTitle>
          <CardDescription>Discuss and share with other CM4 IoT Platform users</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page connects you to the community forum where you can discuss and share with other users.</p>
        </CardContent>
      </Card>
    </div>
  )
}
