import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

// Helper to detect if we're in preview/dev mode
function isV0Preview(): boolean {
  return process.env.NEXT_PUBLIC_V0_PREVIEW === "true" || process.env.NODE_ENV === "development"
}

// Mock alerts for development/preview mode
function getMockAlerts() {
  return [
    {
      id: "alert-1",
      title: "CAN0 Interface Down",
      description: "CAN0 interface is not responding",
      timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      severity: "high",
    },
    {
      id: "alert-2",
      title: "Temperature Sensor Warning",
      description: "Temperature above threshold (42°C)",
      timestamp: Date.now() - 25 * 60 * 1000, // 25 minutes ago
      severity: "medium",
    },
    {
      id: "alert-3",
      title: "New Device Connected",
      description: "Temperature sensor connected via I2C",
      timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
      severity: "info",
    },
    {
      id: "alert-4",
      title: "System Update Available",
      description: "New firmware update available",
      timestamp: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
      severity: "info",
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    if (isV0Preview()) {
      // In preview mode, just return mock data
      return NextResponse.json({
        success: true,
        alerts: getMockAlerts(),
      })
    }

    // In production, get alerts from our storage
    // Path to alerts storage file
    const alertsFilePath = path.join(process.cwd(), "data", "alerts.json")

    try {
      // Read current alerts
      const alertsData = await readFile(alertsFilePath, 'utf-8')
        .then(data => JSON.parse(data))
        .catch(() => ({ alerts: [] }))

      return NextResponse.json({
        success: true,
        alerts: alertsData.alerts,
      })
    } catch (error) {
      console.error("Error reading alerts file:", error)
      // If there's an error, return empty alerts
      return NextResponse.json({
        success: false,
        alerts: [],
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  } catch (error) {
    console.error("Error fetching alerts:", error)
    return NextResponse.json({
      success: false,
      alerts: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
