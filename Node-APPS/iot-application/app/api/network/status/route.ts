import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Helper function to determine if running in preview mode
function isV0Preview(): boolean {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    process.env.NODE_ENV === 'development'
}

// Get mock data for preview mode or development
function getMockNetworkStatus() {
  return {
    wifi: {
      connected: true,
      ssid: 'CM4_Network',
      ipAddress: '192.168.1.105',
      signalStrength: -58
    },
    ethernet: {
      connected: true,
      ipAddress: '192.168.1.100',
      speed: '1 Gbps'
    },
    internet: {
      connected: true,
      status: 'Online',
      ping: 24
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    if (isV0Preview()) {
      return NextResponse.json({ 
        success: true, 
        networkStatus: getMockNetworkStatus() 
      })
    }

    // Get Wi-Fi information
    const wifiData = await getWifiStatus()
    
    // Get Ethernet information
    const ethernetData = await getEthernetStatus()
    
    // Check internet connectivity
    const internetData = await checkInternetConnectivity()
    
    const networkStatus = {
      wifi: wifiData,
      ethernet: ethernetData,
      internet: internetData
    }
    
    return NextResponse.json({ success: true, networkStatus })
  } catch (error) {
    console.error('Error fetching network status:', error)
    // Return mock data as fallback
    return NextResponse.json({ 
      success: false, 
      networkStatus: getMockNetworkStatus(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Get Wi-Fi status using nmcli
async function getWifiStatus() {
  try {
    // Get Wi-Fi device information
    const { stdout: deviceInfo } = await execAsync('nmcli -t -f DEVICE,STATE,CONNECTION device | grep wlan0')
    
    if (!deviceInfo || !deviceInfo.includes('connected')) {
      return { connected: false }
    }
    
    // Get SSID information
    const { stdout: ssidInfo } = await execAsync('iwconfig wlan0 | grep ESSID')
    const ssidMatch = ssidInfo.match(/ESSID:"([^"]*)"/)
    const ssid = ssidMatch ? ssidMatch[1] : 'Unknown'
    
    // Get IP address
    const { stdout: ipInfo } = await execAsync('ip addr show wlan0 | grep "inet " | awk \'{print $2}\' | cut -d/ -f1')
    const ipAddress = ipInfo.trim() || 'Not assigned'
    
    // Get signal strength
    const { stdout: signalInfo } = await execAsync('iwconfig wlan0 | grep -i --color=never "Signal level"')
    const signalMatch = signalInfo.match(/Signal level=(-\d+)/)
    const signalStrength = signalMatch ? parseInt(signalMatch[1]) : null
    
    return {
      connected: true,
      ssid,
      ipAddress,
      signalStrength
    }
  } catch (error) {
    console.error('Error getting Wi-Fi status:', error)
    return { connected: false }
  }
}

// Get Ethernet status using ip command
async function getEthernetStatus() {
  try {
    // Check if eth0 is up
    const { stdout: linkState } = await execAsync('ip link show eth0 | grep "state UP"')
    const isConnected = linkState.includes('state UP')
    
    if (!isConnected) {
      return { connected: false }
    }
    
    // Get IP address
    const { stdout: ipInfo } = await execAsync('ip addr show eth0 | grep "inet " | awk \'{print $2}\' | cut -d/ -f1')
    const ipAddress = ipInfo.trim() || 'Not assigned'
    
    // Get link speed
    const { stdout: speedInfo } = await execAsync('cat /sys/class/net/eth0/speed 2>/dev/null || echo "Unknown"')
    const speedRaw = speedInfo.trim()
    const speed = speedRaw !== 'Unknown' ? `${speedRaw} Mbps` : 'Unknown'
    
    return {
      connected: true,
      ipAddress,
      speed
    }
  } catch (error) {
    console.error('Error getting Ethernet status:', error)
    return { connected: false }
  }
}

// Check internet connectivity by pinging a reliable host
async function checkInternetConnectivity() {
  try {
    // Try to ping Google's DNS server
    const { stdout: pingOutput } = await execAsync('ping -c 1 8.8.8.8')
    
    // Extract ping time
    const pingMatch = pingOutput.match(/time=(\d+(\.\d+)?)/)
    const pingTime = pingMatch ? parseFloat(pingMatch[1]) : null
    
    return {
      connected: true,
      status: 'Online',
      ping: pingTime
    }
  } catch (error) {
    console.error('Error checking internet connectivity:', error)
    return {
      connected: false,
      status: 'Offline',
      ping: null
    }
  }
}
