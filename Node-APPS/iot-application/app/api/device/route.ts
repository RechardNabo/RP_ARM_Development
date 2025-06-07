import { type NextRequest, NextResponse } from "next/server"

// This is a simulated device control API endpoint
// In a real application, you would connect to the actual hardware

interface DeviceState {
  id: string
  name: string
  type: string
  power: boolean
  settings: Record<string, number | boolean | string>
  lastUpdated: number
}

// In-memory storage for demo purposes
const devices: Record<string, DeviceState> = {
  "fan-01": {
    id: "fan-01",
    name: "Main Fan",
    type: "fan",
    power: true,
    settings: {
      speed: 50,
      oscillate: true,
      mode: "normal",
    },
    lastUpdated: Date.now(),
  },
  "light-01": {
    id: "light-01",
    name: "Room Light",
    type: "light",
    power: true,
    settings: {
      brightness: 75,
      colorTemp: 4000,
      rgb: "#FFFFFF",
    },
    lastUpdated: Date.now(),
  },
  "thermo-01": {
    id: "thermo-01",
    name: "Thermostat",
    type: "thermostat",
    power: true,
    settings: {
      targetTemp: 22,
      mode: "auto",
      fanSpeed: "auto",
    },
    lastUpdated: Date.now(),
  },
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const deviceId = searchParams.get("id")

  if (deviceId && deviceId in devices) {
    return NextResponse.json({
      success: true,
      data: devices[deviceId],
    })
  }

  return NextResponse.json({
    success: true,
    data: Object.values(devices),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing device ID",
        },
        { status: 400 },
      )
    }

    const { id, ...updates } = body

    if (!(id in devices)) {
      return NextResponse.json(
        {
          success: false,
          error: "Device not found",
        },
        { status: 404 },
      )
    }

    // Update device state
    if (updates.power !== undefined) {
      devices[id].power = Boolean(updates.power)
    }

    if (updates.settings) {
      devices[id].settings = {
        ...devices[id].settings,
        ...updates.settings,
      }
    }

    devices[id].lastUpdated = Date.now()

    return NextResponse.json({
      success: true,
      data: devices[id],
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
      },
      { status: 400 },
    )
  }
}
