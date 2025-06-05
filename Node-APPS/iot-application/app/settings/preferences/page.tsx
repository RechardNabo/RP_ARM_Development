import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sliders } from "lucide-react"

export default function SettingsPreferencesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Localization & Preferences</h1>
        <Sliders className="h-6 w-6 text-green-500" />
      </div>
      <p className="text-muted-foreground">Configure system preferences and localization settings</p>

      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
          <CardDescription>Customize your system experience</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            This page allows you to configure system preferences, language settings, and other customization options.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
