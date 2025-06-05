"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { isPreviewMode, setPreviewMode } from "@/lib/utils/preview-mode"

export function PreviewModeIndicator() {
  const [previewEnabled, setPreviewEnabled] = useState(false)

  useEffect(() => {
    // Check if we're in preview mode
    setPreviewEnabled(isPreviewMode())
  }, [])

  const togglePreviewMode = (enabled: boolean) => {
    setPreviewEnabled(enabled)
    setPreviewMode(enabled)

    // Reload the page to apply changes
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-md">
      <Badge
        variant={previewEnabled ? "default" : "outline"}
        className={previewEnabled ? "bg-yellow-500 hover:bg-yellow-600" : ""}
      >
        {previewEnabled ? "Preview Mode" : "Normal Mode"}
      </Badge>
      <div className="flex items-center space-x-2">
        <Switch id="preview-mode" checked={previewEnabled} onCheckedChange={togglePreviewMode} />
        <Label htmlFor="preview-mode">Toggle</Label>
      </div>
    </div>
  )
}
