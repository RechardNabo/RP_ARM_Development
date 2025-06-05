import { type NextRequest, NextResponse } from "next/server"

// This is a simulated MQTT broker API endpoint
// In a real application, you would connect to an actual MQTT broker

interface SensorData {
  value: number
  unit: string
  timestamp: number
}

// In-memory storage for demo purposes
const sensorReadings: Record<string, SensorData[]> = {
  temperature: [],
  humidity: [],
  pressure: [],
}

// Add some initial data
for (let i = 0; i < 10; i++) {
  const timestamp = Date.now() - (9 - i) * 60000

  sensorReadings.temperature.push({
    value: Math.round((20 + Math.random() * 5) * 10) / 10,
    unit: "°C",
    timestamp,
  })

  sensorReadings.humidity.push({
    value: Math.round((40 + Math.random() * 20) * 10) / 10,
    unit: "%",
    timestamp,
  })

  sensorReadings.pressure.push({
    value: Math.round((1000 + Math.random() * 15) * 10) / 10,
    unit: "hPa",
    timestamp,
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sensor = searchParams.get("sensor")

  if (sensor && sensor in sensorReadings) {
    return NextResponse.json({
      success: true,
      data: sensorReadings[sensor],
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      temperature: sensorReadings.temperature.slice(-1)[0],
      humidity: sensorReadings.humidity.slice(-1)[0],
      pressure: sensorReadings.pressure.slice(-1)[0],
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.topic || !body.payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing topic or payload",
        },
        { status: 400 },
      )
    }

    // Process the MQTT message
    const { topic, payload } = body

    // Example: topic = "cm4/sensors/temperature"
    const topicParts = topic.split("/")
    if (topicParts.length >= 3 && topicParts[0] === "cm4" && topicParts[1] === "sensors") {
      const sensorType = topicParts[2]

      if (sensorType in sensorReadings) {
        try {
          const data = typeof payload === "string" ? JSON.parse(payload) : payload

          sensorReadings[sensorType].push({
            value: data.value,
            unit: data.unit,
            timestamp: Date.now(),
          })

          // Keep only the last 100 readings
          if (sensorReadings[sensorType].length > 100) {
            sensorReadings[sensorType] = sensorReadings[sensorType].slice(-100)
          }
        } catch (e) {
          console.error("Error parsing payload:", e)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Message published",
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
