// Bluetooth interface management for the Raspberry Pi
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface BluetoothStatus {
  available: boolean
  powered: boolean
  controllerId?: string
  controllerName?: string
  controllerAlias?: string
  discoverable?: boolean
  discovering?: boolean
  pairable?: boolean
  roles?: string[]
  error?: string
}

export interface BluetoothInterface {
  initialize(): Promise<boolean>
  shutdown(): Promise<boolean>
  isInterfaceInitialized(): boolean
  getControllerInfo(): Promise<Record<string, string>>
  getStatus(): Promise<BluetoothStatus>
}

class BluetoothInterfaceImpl implements BluetoothInterface {
  private initialized = false
  private controllerInfo: Record<string, string> = {}
  
  constructor() {
    console.log('Bluetooth Interface created')
  }

  public async initialize(): Promise<boolean> {
    try {
      console.log('Initializing Bluetooth interface')
      
      // Check if Bluetooth is available
      const controllerInfo = await this.getControllerInfo()
      this.controllerInfo = controllerInfo
      
      if (Object.keys(controllerInfo).length === 0) {
        console.log('No Bluetooth controller found')
        return false
      }
      
      console.log('Bluetooth controller found:', controllerInfo)
      
      this.initialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize Bluetooth interface:', error)
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

  public async getControllerInfo(): Promise<Record<string, string>> {
    try {
      // Get Bluetooth controller info using bluetoothctl
      const { stdout } = await execAsync('bluetoothctl show 2>/dev/null || echo "No bluetooth"')
      
      if (stdout.includes('No bluetooth') || stdout.trim() === '') {
        return {}
      }
      
      const lines = stdout.trim().split('\n')
      const controllerInfo: Record<string, string> = {}
      
      for (const line of lines) {
        const match = line.match(/^\\s*([^:]+):\\s*(.*)$/)
        if (match) {
          const [, key, value] = match
          controllerInfo[key.trim()] = value.trim()
        }
      }
      
      return controllerInfo
    } catch (error) {
      console.error('Error getting Bluetooth controller info:', error)
      return {}
    }
  }

  public async getStatus(): Promise<BluetoothStatus> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }
      
      // Update controller info
      const controllerInfo = await this.getControllerInfo()
      this.controllerInfo = controllerInfo
      
      // Extract useful information
      const controllerId = Object.keys(controllerInfo)[0] || ''
      const powered = controllerInfo['Powered'] === 'yes'
      const controllerName = controllerInfo['Name'] || ''
      const controllerAlias = controllerInfo['Alias'] || ''
      const discoverable = controllerInfo['Discoverable'] === 'yes'
      const discovering = controllerInfo['Discovering'] === 'yes'
      const pairable = controllerInfo['Pairable'] === 'yes'
      
      // Parse roles if available
      const roles: string[] = []
      if (controllerInfo['Roles']) {
        controllerInfo['Roles'].split(',').forEach(role => {
          roles.push(role.trim())
        })
      }
      
      return {
        available: Object.keys(controllerInfo).length > 0,
        powered,
        controllerId,
        controllerName,
        controllerAlias,
        discoverable,
        discovering,
        pairable,
        roles
      }
    } catch (error) {
      console.error('Error getting Bluetooth status:', error)
      return {
        available: false,
        powered: false,
        error: String(error)
      }
    }
  }
}

// Singleton instance
let bluetoothInterface: BluetoothInterface | null = null

export function getBluetoothInterface(): BluetoothInterface {
  if (!bluetoothInterface) {
    bluetoothInterface = new BluetoothInterfaceImpl()
  }
  return bluetoothInterface
}
