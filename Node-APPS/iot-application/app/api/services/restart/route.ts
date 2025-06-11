import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { getServiceMonitor } from "@/lib/service-monitor"

const execAsync = promisify(exec)

// Helper to detect if we're in preview/dev mode
function isV0Preview(): boolean {
  return process.env.NEXT_PUBLIC_V0_PREVIEW === "true" || process.env.NODE_ENV === "development"
}

// Define which services can be restarted
// This is for security - we don't want to allow arbitrary service restarts
const allowedServices = [
  "mongodb",
  "influxd", 
  "grafana-server", 
  "nginx", 
  "webmin"
]

// Map our service names to actual systemd service names
const serviceMapping: Record<string, string> = {
  "mongodb": "mongodb",
  "influxd": "influxdb",
  "grafana-server": "grafana-server",
  "nginx": "nginx",
  "webmin": "webmin"
}

export async function POST(request: NextRequest) {
  try {
    // Parse the services to restart from request body
    // If empty, restart all allowed services
    let servicesToRestart: string[] = []
    try {
      const body = await request.json()
      servicesToRestart = Array.isArray(body.services) ? body.services : []
    } catch (error) {
      // If body parsing fails, default to empty array
      servicesToRestart = []
    }

    // If no services specified, restart all allowed services
    if (servicesToRestart.length === 0) {
      servicesToRestart = [...allowedServices]
    }

    // Filter out any services that aren't on our allowed list
    servicesToRestart = servicesToRestart.filter(s => allowedServices.includes(s))

    // If in preview mode, use the service monitor simulator
    if (isV0Preview()) {
      const serviceMonitor = getServiceMonitor()
      const results = []

      for (const service of servicesToRestart) {
        const success = await serviceMonitor.restartService(service)
        results.push({
          service,
          success,
          message: success ? `${service} restarted successfully` : `Failed to restart ${service}`
        })
      }

      return NextResponse.json({ 
        success: true, 
        message: "Services restarted",
        results
      })
    }

    // In production on the Raspberry Pi, use systemd to restart services
    const results = []
    
    for (const service of servicesToRestart) {
      try {
        // Get the actual systemd service name
        const systemdServiceName = serviceMapping[service] || service
        
        // Execute the restart command
        await execAsync(`sudo systemctl restart ${systemdServiceName}`)
        
        results.push({
          service,
          success: true,
          message: `${service} restarted successfully`
        })
      } catch (error) {
        console.error(`Error restarting ${service}:`, error)
        
        results.push({
          service,
          success: false,
          message: `Failed to restart ${service}: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }

    // Determine overall success based on individual results
    const allSuccessful = results.every(r => r.success)

    return NextResponse.json({ 
      success: allSuccessful, 
      message: allSuccessful ? "All services restarted successfully" : "Some services failed to restart",
      results
    }, { status: allSuccessful ? 200 : 207 })
  } catch (error) {
    console.error("Error restarting services:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to restart services",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
