// SPI interface management for the Raspberry Pi
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface SPIStatus {
  available: boolean
  devices: string[]
  error?: string
}

export interface SPIInterface {
  initialize(): Promise<boolean>
  shutdown(): Promise<boolean>
  isInterfaceInitialized(): boolean
  getDevices(): Promise<string[]>
  getStatus(): Promise<SPIStatus>
}

class SPIInterfaceImpl implements SPIInterface {
  private initialized = false
  private devices: string[] = []
  
  constructor() {
    console.log('SPI Interface created')
  }

  public async initialize(): Promise<boolean> {
    try {
      console.log('Initializing SPI interface')
      
      // Check if SPI is available by looking for SPI device files
      const devices = await this.getDevices()
      this.devices = devices
      
      if (devices.length === 0) {
        console.log('No SPI devices found')
        return false
      }
      
      console.log(`Found SPI devices: ${devices.join(', ')}`)
      
      this.initialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize SPI interface:', error)
      return false
    }
  }

  public async shutdown(): Promise<boolean> {
    this.initialized = false
    return true
  }

  public isInterfaceInitialized(): boolean {
    return this.initialized
  }

  public async getDevices(): Promise<string[]> {
    try {
      // List SPI devices by looking in /dev
      const { stdout } = await execAsync('ls -1 /dev/spi* 2>/dev/null || true')
      const devices = stdout.trim()
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(path => path.split('/').pop() || '')
      
      return devices
    } catch (error) {
      console.error('Error getting SPI devices:', error)
      return []
    }
  }

  public async getStatus(): Promise<SPIStatus> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }
      
      // Update device list
      const devices = await this.getDevices()
      this.devices = devices
      
      return {
        available: devices.length > 0,
        devices
      }
    } catch (error) {
      console.error('Error getting SPI status:', error)
      return {
        available: false,
        devices: [],
        error: String(error)
      }
    }
  }
}

// Singleton instance
let spiInterface: SPIInterface | null = null

export function getSPIInterface(): SPIInterface {
  if (!spiInterface) {
    spiInterface = new SPIInterfaceImpl()
  }
  return spiInterface
}
