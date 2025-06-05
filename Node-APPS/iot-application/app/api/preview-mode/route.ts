import { NextResponse } from "next/server"
import { getMockHardwareStatus, getMockDeviceData, getMockSensorData } from "@/lib/mock-data-provider"

// This API route provides mock data for preview mode
export async function GET(request: Request) {
  const url = new URL(request.url)
  const dataType = url.searchParams.get("type") || "hardware"

  switch (dataType) {
    case "hardware":
      return NextResponse.json({ status: getMockHardwareStatus() })
    case "devices":
      return NextResponse.json({ devices: getMockDeviceData() })
    case "sensors":
      const hours = Number.parseInt(url.searchParams.get("hours") || "24", 10)
      return NextResponse.json({ data: getMockSensorData(hours) })
    default:
      return NextResponse.json({ error: "Unknown data type" }, { status: 400 })
  }
}
