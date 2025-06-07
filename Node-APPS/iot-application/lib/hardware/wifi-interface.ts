// WiFi interface service for the CM4-IO-WIRELESS-BASE
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"

const execAsync = promisify(exec)
const writeFileAsync = promisify(fs.writeFile)
const readFileAsync = promisify(fs.readFile)

export interface WiFiNetwork {
  ssid: string
  bssid?: string
  signal?: number
  quality?: number
  security?: string
  frequency?: number
  channel?: number
  inUse?: boolean
}

export interface WiFiStatus {
  interface: string
  connected: boolean
  ssid?: string
  ipAddress?: string
  macAddress?: string
  signalStrength?: number
  txPower?: number
  bitrate?: number
}

export class WiFiInterface {
  private static instance: WiFiInterface
  private interface: string
  private isInitialized = false

  private constructor(interfaceName = "wlan0") {
    this.interface = interfaceName
  }

  public static getInstance(interfaceName = "wlan0"): WiFiInterface {
    if (!WiFiInterface.instance) {
      WiFiInterface.instance = new WiFiInterface(interfaceName)
    }
    return WiFiInterface.instance
  }

  public async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log(`WiFi interface ${this.interface} already initialized`)
        return true
      }

      // Check if the interface exists
      const { stdout: ifconfigOutput } = await execAsync(`ifconfig ${this.interface}`)
      if (!ifconfigOutput.includes(this.interface)) {
        console.error(`WiFi interface ${this.interface} not found`)
        return false
      }

      // Check if the interface is already up
      if (ifconfigOutput.includes("UP")) {
        console.log(`WiFi interface ${this.interface} is already up`)
        this.isInitialized = true
        return true
      }

      // Bring up the interface
      await execAsync(`sudo ip link set ${this.interface} up`)
      console.log(`WiFi interface ${this.interface} initialized`)
      this.isInitialized = true
      return true
    } catch (error) {
      console.error(`Failed to initialize WiFi interface ${this.interface}:`, error)
      return false
    }
  }

  public async scan(): Promise<WiFiNetwork[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const { stdout } = await execAsync(`sudo iwlist ${this.interface} scan`)
      const networks: WiFiNetwork[] = []

      // Parse the output to extract network information
      const cells = stdout.split("Cell ").slice(1)

      for (const cell of cells) {
        try {
          const ssidMatch = cell.match(/ESSID:"([^"]+)"/)
          if (!ssidMatch) continue

          const ssid = ssidMatch[1]
          const bssidMatch = cell.match(/Address: ([0-9A-F:]+)/i)
          const signalMatch = cell.match(/Signal level=(-\d+) dBm/)
          const qualityMatch = cell.match(/Quality=(\d+)\/(\d+)/)
          const frequencyMatch = cell.match(/Frequency:([0-9.]+) GHz/)
          const encryptionMatch = cell.match(/Encryption key:(on|off)/)

          const network: WiFiNetwork = { ssid }

          if (bssidMatch) network.bssid = bssidMatch[1]
          if (signalMatch) network.signal = Number.parseInt(signalMatch[1], 10)
          if (qualityMatch) {
            const [, quality, maxQuality] = qualityMatch
            network.quality = (Number.parseInt(quality, 10) / Number.parseInt(maxQuality, 10)) * 100
          }
          if (frequencyMatch) {
            network.frequency = Number.parseFloat(frequencyMatch[1]) * 1000 // Convert to MHz
            // Calculate channel from frequency (approximate)
            if (network.frequency >= 2412 && network.frequency <= 2484) {
              network.channel = Math.round((network.frequency - 2412) / 5) + 1
            } else if (network.frequency >= 5170 && network.frequency <= 5825) {
              network.channel = Math.round((network.frequency - 5170) / 5) + 34
            }
          }
          if (encryptionMatch) {
            network.security = encryptionMatch[1] === "on" ? "WPA/WPA2" : "None"
          }

          // Check if this is the currently connected network
          const status = await this.getStatus()
          if (status.connected && status.ssid === ssid) {
            network.inUse = true
          }

          networks.push(network)
        } catch (error) {
          console.error("Error parsing WiFi network:", error)
        }
      }

      return networks
    } catch (error) {
      console.error(`Failed to scan WiFi networks on interface ${this.interface}:`, error)
      return []
    }
  }

  public async getStatus(): Promise<WiFiStatus> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const status: WiFiStatus = {
        interface: this.interface,
        connected: false,
      }

      // Get interface status
      const { stdout: iwconfigOutput } = await execAsync(`iwconfig ${this.interface}`).catch(() => ({ stdout: "" }))
      const { stdout: ifconfigOutput } = await execAsync(`ifconfig ${this.interface}`).catch(() => ({ stdout: "" }))

      // Check if connected to a network
      const ssidMatch = iwconfigOutput.match(/ESSID:"([^"]+)"/)
      if (ssidMatch) {
        status.connected = true
        status.ssid = ssidMatch[1]

        // Extract signal strength
        const signalMatch = iwconfigOutput.match(/Signal level=(-\d+) dBm/)
        if (signalMatch) {
          status.signalStrength = Number.parseInt(signalMatch[1], 10)
        }

        // Extract TX power
        const txPowerMatch = iwconfigOutput.match(/Tx-Power=(\d+) dBm/)
        if (txPowerMatch) {
          status.txPower = Number.parseInt(txPowerMatch[1], 10)
        }

        // Extract bitrate
        const bitrateMatch = iwconfigOutput.match(/Bit Rate=([0-9.]+) Mb\/s/)
        if (bitrateMatch) {
          status.bitrate = Number.parseFloat(bitrateMatch[1])
        }
      }

      // Extract IP address
      const ipMatch = ifconfigOutput.match(/inet (\d+\.\d+\.\d+\.\d+)/)
      if (ipMatch) {
        status.ipAddress = ipMatch[1]
      }

      // Extract MAC address
      const macMatch = ifconfigOutput.match(/ether ([0-9a-f:]+)/i)
      if (macMatch) {
        status.macAddress = macMatch[1]
      }

      return status
    } catch (error) {
      console.error(`Failed to get status for WiFi interface ${this.interface}:`, error)
      return { interface: this.interface, connected: false }
    }
  }

  public async connect(ssid: string, password: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Create a wpa_supplicant configuration file
      const wpaConfig = `
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="${ssid}"
    psk="${password}"
    key_mgmt=WPA-PSK
}
`

      const configPath = `/tmp/wpa_supplicant_${this.interface}.conf`
      await writeFileAsync(configPath, wpaConfig)

      // Connect to the network
      await execAsync(`sudo wpa_supplicant -B -i ${this.interface} -c ${configPath}`)

      // Wait for connection to establish
      await new Promise((resolve) => setTimeout(resolve, 5000))

      // Get IP address via DHCP
      await execAsync(`sudo dhclient ${this.interface}`)

      // Check if connection was successful
      const status = await this.getStatus()

      // Clean up temporary file
      fs.unlinkSync(configPath)

      return status.connected && status.ssid === ssid
    } catch (error) {
      console.error(`Failed to connect to WiFi network ${ssid} on interface ${this.interface}:`, error)
      return false
    }
  }

  public async disconnect(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.log(`WiFi interface ${this.interface} is not initialized`)
        return true
      }

      // Kill any running wpa_supplicant processes for this interface
      await execAsync(`sudo killall -q wpa_supplicant`).catch(() => {})

      // Release DHCP lease
      await execAsync(`sudo dhclient -r ${this.interface}`).catch(() => {})

      // Bring down the interface
      await execAsync(`sudo ip link set ${this.interface} down`)

      console.log(`Disconnected from WiFi network on interface ${this.interface}`)
      return true
    } catch (error) {
      console.error(`Failed to disconnect from WiFi network on interface ${this.interface}:`, error)
      return false
    }
  }

  public async createAccessPoint(ssid: string, password: string, channel = 6): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Check if hostapd is installed
      await execAsync("which hostapd").catch(() => {
        throw new Error("hostapd is not installed. Please install it with: sudo apt-get install hostapd")
      })

      // Check if dnsmasq is installed
      await execAsync("which dnsmasq").catch(() => {
        throw new Error("dnsmasq is not installed. Please install it with: sudo apt-get install dnsmasq")
      })

      // Create hostapd configuration
      const hostapdConfig = `
interface=${this.interface}
driver=nl80211
ssid=${ssid}
hw_mode=g
channel=${channel}
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=${password}
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
`

      const hostapdPath = "/tmp/hostapd.conf"
      await writeFileAsync(hostapdPath, hostapdConfig)

      // Create dnsmasq configuration
      const dnsmasqConfig = `
interface=${this.interface}
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
`

      const dnsmasqPath = "/tmp/dnsmasq.conf"
      await writeFileAsync(dnsmasqPath, dnsmasqConfig)

      // Configure static IP
      await execAsync(`sudo ifconfig ${this.interface} 192.168.4.1 netmask 255.255.255.0`)

      // Start hostapd
      await execAsync(`sudo hostapd -B ${hostapdPath}`)

      // Start dnsmasq
      await execAsync(`sudo dnsmasq -C ${dnsmasqPath}`)

      console.log(`Created access point ${ssid} on interface ${this.interface}`)
      return true
    } catch (error) {
      console.error(`Failed to create access point on interface ${this.interface}:`, error)
      return false
    }
  }

  public async stopAccessPoint(): Promise<boolean> {
    try {
      // Kill hostapd and dnsmasq
      await execAsync("sudo killall hostapd").catch(() => {})
      await execAsync("sudo killall dnsmasq").catch(() => {})

      // Clean up temporary files
      fs.unlinkSync("/tmp/hostapd.conf").catch(() => {})
      fs.unlinkSync("/tmp/dnsmasq.conf").catch(() => {})

      console.log(`Stopped access point on interface ${this.interface}`)
      return true
    } catch (error) {
      console.error(`Failed to stop access point on interface ${this.interface}:`, error)
      return false
    }
  }

  public isInterfaceInitialized(): boolean {
    return this.isInitialized
  }
}

// Create a singleton instance
let wifiInterface: WiFiInterface | null = null

export function getWiFiInterface(interfaceName = "wlan0"): WiFiInterface {
  if (!wifiInterface) {
    wifiInterface = WiFiInterface.getInstance(interfaceName)
  }
  return wifiInterface
}
