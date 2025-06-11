import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { getHardwareManager } from "@/lib/hardware/hardware-manager"

// Helper to detect if we're in preview mode
function isV0Preview(): boolean {
  return process.env.NEXT_PUBLIC_V0_PREVIEW === "true" || process.env.NODE_ENV === "development"
}

const execAsync = promisify(exec)

interface DeviceCounts {
  wifi: number
  bluetooth: number
  ethernet: number
  i2c: number
  spi: number
  sensors: number
}

// Mock data for preview mode
function getMockDeviceCounts(): DeviceCounts {
  return {
    wifi: 5,
    bluetooth: 3,
    ethernet: 2,
    i2c: 4,
    spi: 2,
    sensors: 8,
  }
}

// Get the count of WiFi devices
async function getWifiDeviceCount(): Promise<number> {
  try {
    // Check connected WiFi devices
    const { stdout } = await execAsync('nmcli device status | grep -c "wifi.*connected"')
    return parseInt(stdout.trim(), 10) || 0
  } catch (error) {
    console.error("Error counting WiFi devices:", error)
    return 0
  }
}

// Get the count of Bluetooth devices
async function getBluetoothDeviceCount(): Promise<number> {
  try {
    // Try to get paired devices
    const { stdout } = await execAsync('bluetoothctl devices | wc -l')
    return parseInt(stdout.trim(), 10) || 0
  } catch (error) {
    console.error("Error counting Bluetooth devices:", error)
    return 0
  }
}

// Get the count of Ethernet devices
async function getEthernetDeviceCount(): Promise<number> {
  try {
    // Count ethernet interfaces that are up
    const { stdout } = await execAsync('ip -br link | grep -c "eth[0-9].*UP"')
    return parseInt(stdout.trim(), 10) || 0
  } catch (error) {
    console.error("Error counting Ethernet devices:", error)
    return 0
  }
}

// Get the count of I2C devices/buses
async function getI2CDeviceCount(): Promise<number> {
  try {
    // Get hardware manager to use the i2c interface we already built
    const hardwareManager = getHardwareManager()
    if (!hardwareManager.isInitialized()) {
      await hardwareManager.initialize()
    }
    const status = await hardwareManager.getStatus()
    
    // Count the total devices across all buses
    let deviceCount = 0
    if (status.i2c.devices) {
      Object.keys(status.i2c.devices).forEach(bus => {
        deviceCount += status.i2c.devices?.[bus]?.length || 0
      })
    }
    
    return deviceCount
  } catch (error) {
    console.error("Error counting I2C devices:", error)
    return 0
  }
}

// Get the count of SPI devices
async function getSPIDeviceCount(): Promise<number> {
  try {
    // Get hardware manager to use the spi interface we already built
    const hardwareManager = getHardwareManager()
    if (!hardwareManager.isInitialized()) {
      await hardwareManager.initialize()
    }
    const status = await hardwareManager.getStatus()
    
    return status.spi.devices?.length || 0
  } catch (error) {
    console.error("Error counting SPI devices:", error)
    return 0
  }
}

// Get the count of sensors (temperature, pressure, etc.)
async function getSensorCount(): Promise<number> {
  try {
    // Count thermal zones and other sensors
    const [thermalZones, lmSensors] = await Promise.all([
      execAsync('ls /sys/class/thermal | grep -c "thermal_zone"'),
      execAsync('command -v sensors && sensors | grep -c "Adapter" || echo "0"')
    ])
    
    const thermalZoneCount = parseInt(thermalZones.stdout.trim(), 10) || 0
    const lmSensorCount = parseInt(lmSensors.stdout.trim(), 10) || 0
    
    return thermalZoneCount + lmSensorCount
  } catch (error) {
    console.error("Error counting sensors:", error)
    return 0
  }
}

// Main API route handler
export async function GET(request: NextRequest) {
  try {
    // If in preview mode, return mock data
    if (isV0Preview()) {
      return NextResponse.json({
        success: true,
        counts: getMockDeviceCounts()
      })
    }
    
    // Get real device counts in parallel
    const [
      wifiCount,
      bluetoothCount,
      ethernetCount,
      i2cCount,
      spiCount,
      sensorCount
    ] = await Promise.all([
      getWifiDeviceCount(),
      getBluetoothDeviceCount(),
      getEthernetDeviceCount(),
      getI2CDeviceCount(),
      getSPIDeviceCount(),
      getSensorCount()
    ])
    
    const deviceCounts: DeviceCounts = {
      wifi: wifiCount,
      bluetooth: bluetoothCount,
      ethernet: ethernetCount,
      i2c: i2cCount,
      spi: spiCount,
      sensors: sensorCount
    }
    
    return NextResponse.json({
      success: true,
      counts: deviceCounts
    })
  } catch (error) {
    console.error("Error in device count API:", error)
    
    // Fallback to mock data on error
    return NextResponse.json({
      success: true,
      counts: getMockDeviceCounts()
    })
  }
}
