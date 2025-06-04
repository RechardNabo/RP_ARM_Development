import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"

export default function ReportsExportPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>
        <Download className="h-6 w-6 text-green-500" />
      </div>
      <p className="text-muted-foreground">Export system data in various formats</p>

      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Export your data in various formats</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page allows you to export your system data in various formats like CSV, JSON, and Excel.</p>
        </CardContent>
      </Card>
    </div>
  )
}
