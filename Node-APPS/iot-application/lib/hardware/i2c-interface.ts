// I2C interface management for the Raspberry Pi
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface I2CStatus {
  available: boolean
  buses: string[]
  devices?: { [bus: string]: string[] }
  error?: string
}

export interface I2CInterface {
  initialize(): Promise<boolean>
  shutdown(): Promise<boolean>
  isInterfaceInitialized(): boolean
  getBuses(): Promise<string[]>
  scanDevices(bus: string): Promise<string[]>
  getStatus(): Promise<I2CStatus>
}

class I2CInterfaceImpl implements I2CInterface {
  private initialized = false
  private buses: string[] = []
  private devices: { [bus: string]: string[] } = {}
  
  constructor() {
    console.log('I2C Interface created')
  }

  public async initialize(): Promise<boolean> {
    try {
      console.log('Initializing I2C interface')
      
      // Check if I2C is available by looking for I2C device files
      const buses = await this.getBuses()
      this.buses = buses
      
      if (buses.length === 0) {
        console.log('No I2C buses found')
        return false
      }
      
      console.log(`Found I2C buses: ${buses.join(', ')}`)
      
      // Scan for devices on each bus
      for (const bus of buses) {
        try {
          const devices = await this.scanDevices(bus)
          this.devices[bus] = devices
          console.log(`I2C bus ${bus} has ${devices.length} devices: ${devices.join(', ')}`)
        } catch (err) {
          console.error(`Error scanning devices on I2C bus ${bus}:`, err)
          this.devices[bus] = []
        }
      }
      
      this.initialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize I2C interface:', error)
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

  public async getBuses(): Promise<string[]> {
    try {
      // List I2C buses by looking in /dev
      const { stdout } = await execAsync('ls -1 /dev/i2c* 2>/dev/null || true')
      const buses = stdout.trim()
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(path => path.split('/').pop() || '')
      
      return buses
    } catch (error) {
      console.error('Error getting I2C buses:', error)
      return []
    }
  }

  public async scanDevices(bus: string): Promise<string[]> {
    try {
      // This would use i2cdetect to scan the bus in a real implementation
      // But for simplicity (and because i2cdetect output is complex to parse),
      // we'll just check if the bus exists
      
      const busPath = `/dev/${bus}`
      const { stdout } = await execAsync(`[ -e ${busPath} ] && echo "exists" || echo "not found"`)
      
      if (stdout.trim() === 'exists') {
        // In a real implementation, we would run i2cdetect and parse the results
        // For now, we'll just return some sample devices for demonstration
        return ['0x20', '0x21'] // Sample device addresses
      }
      
      return []
    } catch (error) {
      console.error(`Error scanning I2C bus ${bus}:`, error)
      return []
    }
  }

  public async getStatus(): Promise<I2CStatus> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }
      
      // Update bus list
      const buses = await this.getBuses()
      this.buses = buses
      
      // Update device list for each bus
      for (const bus of buses) {
        try {
          this.devices[bus] = await this.scanDevices(bus)
        } catch (err) {
          this.devices[bus] = []
        }
      }
      
      return {
        available: buses.length > 0,
        buses,
        devices: this.devices
      }
    } catch (error) {
      console.error('Error getting I2C status:', error)
      return {
        available: false,
        buses: [],
        error: String(error)
      }
    }
  }
}

// Singleton instance
let i2cInterface: I2CInterface | null = null

export function getI2CInterface(): I2CInterface {
  if (!i2cInterface) {
    i2cInterface = new I2CInterfaceImpl()
  }
  return i2cInterface
}
