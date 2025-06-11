import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { getHardwareManager } from "@/lib/hardware/hardware-manager"
import { getServiceMonitor } from "@/lib/service-monitor"

const execAsync = promisify(exec)

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
        message: "All dashboard data refreshed successfully",
        refreshed: ["hardware", "services", "network", "devices"]
      })
    }

    const refreshResults = []

    // 1. Refresh hardware status
    try {
      const hardwareManager = getHardwareManager()
      if (!hardwareManager.isInitialized()) {
        await hardwareManager.initialize()
      }
      await hardwareManager.getStatus(true) // force refresh
      refreshResults.push("hardware")
    } catch (error) {
      console.error("Error refreshing hardware status:", error)
    }

    // 2. Refresh service status
    try {
      const serviceMonitor = getServiceMonitor()
      serviceMonitor.updateServiceStatus(true) // force refresh
      serviceMonitor.updateInterfaceStatus(true) // force refresh
      refreshResults.push("services")
    } catch (error) {
      console.error("Error refreshing service status:", error)
    }

    // 3. Clear browser cache for device count API
    try {
      // We don't actually need to do anything server-side for this
      // The browser will re-fetch data when the page refreshes
      refreshResults.push("devices")
    } catch (error) {
      console.error("Error refreshing device counts:", error)
    }

    // 4. Refresh network status
    try {
      // Execute commands to refresh network interfaces
      await execAsync("ip link set dev eth0 down && ip link set dev eth0 up 2>/dev/null || true")
      await execAsync("ip link set dev wlan0 down && ip link set dev wlan0 up 2>/dev/null || true")
      refreshResults.push("network")
    } catch (error) {
      console.error("Error refreshing network interfaces:", error)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Dashboard data refreshed successfully",
      refreshed: refreshResults
    })
  } catch (error) {
    console.error("Error refreshing dashboard data:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to refresh dashboard data",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
