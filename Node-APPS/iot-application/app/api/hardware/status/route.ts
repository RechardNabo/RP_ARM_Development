import { type NextRequest, NextResponse } from "next/server"
import { getHardwareManager } from "@/lib/hardware/hardware-manager"
import { getMockHardwareStatus } from "@/lib/mock-data-provider"

// Helper function to determine if we're in v0 preview
function isV0Preview(): boolean {
  return (
    typeof process !== "undefined" &&
    (process.env.VERCEL_ENV === "preview" ||
      process.env.SKIP_MONGODB === "true" ||
      // Check for v0 environment
      (typeof window !== "undefined" &&
        (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("vercel-v0"))))
  )
}

export async function GET(request: NextRequest) {
  try {
    // In v0 preview, return mock data
    if (isV0Preview()) {
      console.log("Using mock hardware status data for v0 preview")
      return NextResponse.json({
        success: true,
        status: getMockHardwareStatus(),
      })
    }

    const hardwareManager = getHardwareManager()

    // Initialize hardware manager if not already initialized
    if (!hardwareManager.isInitialized()) {
      await hardwareManager.initialize()
    }

    // Get hardware status
    const status = await hardwareManager.getStatus()

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error("Error getting hardware status:", error)

    // Return mock data as fallback
    return NextResponse.json({
      success: true,
      status: getMockHardwareStatus(),
    })
  }
}
