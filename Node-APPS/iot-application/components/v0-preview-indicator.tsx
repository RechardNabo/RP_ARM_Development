"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

export function V0PreviewIndicator() {
  const [isV0, setIsV0] = useState(false)

  useEffect(() => {
    // Check if we're in v0 preview
    const hostname = window.location.hostname
    setIsV0(hostname.includes("v0.dev") || hostname.includes("vercel-v0"))
  }, [])

  if (!isV0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-md">
      <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
        v0 Preview Mode
      </Badge>
      <span className="text-xs text-muted-foreground">Using mock data</span>
    </div>
  )
}
