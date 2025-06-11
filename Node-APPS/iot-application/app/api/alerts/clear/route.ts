import { NextRequest, NextResponse } from "next/server"
import { readFile, writeFile } from "fs/promises"
import path from "path"

// Helper to detect if we're in preview/dev mode
function isV0Preview(): boolean {
  return process.env.NEXT_PUBLIC_V0_PREVIEW === "true" || process.env.NODE_ENV === "development"
}

export async function POST(request: NextRequest) {
  try {
    if (isV0Preview()) {
      // In preview mode, just return success
      return NextResponse.json({ 
        success: true, 
        message: "All alerts cleared successfully",
        count: 0
      })
    }

    // In production, clear alerts from our storage
    // Path to alerts storage file
    const alertsFilePath = path.join(process.cwd(), "data", "alerts.json")
    
    try {
      // Read current alerts
      const alertsData = await readFile(alertsFilePath, 'utf-8')
        .then(data => JSON.parse(data))
        .catch(() => ({ alerts: [] }))
      
      // Store the count for reporting
      const clearedCount = alertsData.alerts.length
      
      // Clear all alerts
      alertsData.alerts = []
      
      // Save the cleared alerts file
      await writeFile(alertsFilePath, JSON.stringify(alertsData, null, 2), 'utf-8')
      
      return NextResponse.json({ 
        success: true, 
        message: "All alerts cleared successfully",
        count: clearedCount
      })
    } catch (error) {
      console.error("Error clearing alerts file:", error)
      throw error
    }
  } catch (error) {
    console.error("Error clearing alerts:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to clear alerts",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
