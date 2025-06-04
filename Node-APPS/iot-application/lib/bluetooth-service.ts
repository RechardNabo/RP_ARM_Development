// This is a simulated Bluetooth service for the frontend
// In a real application, you would use the Web Bluetooth API

export interface BluetoothDevice {
  id: string
  name: string
  connected: boolean
  rssi: number // Signal strength in dBm
}

export interface BluetoothCharacteristic {
  uuid: string
  service: string
  properties: {
    read: boolean
    write: boolean
    notify: boolean
  }
}

export class BluetoothService {
  private devices: BluetoothDevice[] = []
  private connected = false
  private connectionListeners: ((connected: boolean) => void)[] = []
  private deviceListeners: ((devices: BluetoothDevice[]) => void)[] = []

  constructor() {
    // Simulate some discovered devices
    this.devices = [
      {
        id: "00:11:22:33:44:55",
        name: "Temperature Sensor",
        connected: false,
        rssi: -70,
      },
      {
        id: "66:77:88:99:AA:BB",
        name: "Smart Light",
        connected: true,
        rssi: -55,
      },
    ]
  }

  isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if Web Bluetooth API is available
      // For simulation, we'll just return true
      resolve(true)
    })
  }

  scan(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate scanning delay
      setTimeout(() => {
        // Add a random device occasionally
        if (Math.random() > 0.7) {
          const newDevice: BluetoothDevice = {
            id: Math.random().toString(16).substring(2, 14),
            name: `Device-${Math.floor(Math.random() * 1000)}`,
            connected: false,
            rssi: -80 + Math.floor(Math.random() * 30),
          }
          this.devices.push(newDevice)
        }

        // Update RSSI values to simulate movement
        this.devices = this.devices.map((device) => ({
          ...device,
          rssi: Math.max(-100, Math.min(-30, device.rssi + (Math.random() * 10 - 5))),
        }))

        this.notifyDeviceListeners()
        resolve()
      }, 2000)
    })
  }

  connect(deviceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const device = this.devices.find((d) => d.id === deviceId)
      if (!device) {
        reject(new Error("Device not found"))
        return
      }

      // Simulate connection delay
      setTimeout(() => {
        device.connected = true
        this.connected = true
        this.notifyConnectionListeners()
        this.notifyDeviceListeners()
        resolve()
      }, 1500)
    })
  }

  disconnect(deviceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const device = this.devices.find((d) => d.id === deviceId)
      if (!device) {
        reject(new Error("Device not found"))
        return
      }

      // Simulate disconnection delay
      setTimeout(() => {
        device.connected = false
        // Check if any devices are still connected
        this.connected = this.devices.some((d) => d.connected)
        this.notifyConnectionListeners()
        this.notifyDeviceListeners()
        resolve()
      }, 1000)
    })
  }

  getDevices(): BluetoothDevice[] {
    return [...this.devices]
  }

  readValue(deviceId: string, serviceUuid: string, characteristicUuid: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const device = this.devices.find((d) => d.id === deviceId)
      if (!device) {
        reject(new Error("Device not found"))
        return
      }

      if (!device || !device.connected) {
        reject(new Error("Device not connected"))
        return
      }

      // Simulate read delay
      setTimeout(() => {
        // Generate random data based on the characteristic
        let data: ArrayBuffer

        if (characteristicUuid.includes("temp")) {
          // Temperature data (20-30°C)
          const temp = 20 + Math.random() * 10
          const view = new DataView(new ArrayBuffer(2))
          view.setInt16(0, temp * 100, true) // Store as fixed-point
          data = view.buffer
        } else if (characteristicUuid.includes("humid")) {
          // Humidity data (30-70%)
          const humidity = 30 + Math.random() * 40
          const view = new DataView(new ArrayBuffer(2))
          view.setUint16(0, humidity * 100, true) // Store as fixed-point
          data = view.buffer
        } else {
          // Generic data
          const buffer = new ArrayBuffer(4)
          const view = new DataView(buffer)
          view.setUint32(0, Math.floor(Math.random() * 0xffffffff), true)
          data = buffer
        }

        resolve(data)
      }, 500)
    })
  }

  writeValue(deviceId: string, serviceUuid: string, characteristicUuid: string, value: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const device = this.devices.find((d) => d.id === deviceId)
      if (!device || !device.connected) {
        reject(new Error("Device not connected"))
        return
      }

      // Simulate write delay
      setTimeout(() => {
        console.log(`Wrote to ${characteristicUuid}: ${new Uint8Array(value)}`)
        resolve()
      }, 500)
    })
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionListeners.push(callback)
    // Immediately notify with current state
    callback(this.connected)
  }

  onDevicesChange(callback: (devices: BluetoothDevice[]) => void): void {
    this.deviceListeners.push(callback)
    // Immediately notify with current devices
    callback(this.devices)
  }

  private notifyConnectionListeners(): void {
    this.connectionListeners.forEach((listener) => listener(this.connected))
  }

  private notifyDeviceListeners(): void {
    this.deviceListeners.forEach((listener) => listener([...this.devices]))
  }
}

// Create a singleton instance
let bluetoothService: BluetoothService | null = null

export function getBluetoothService(): BluetoothService {
  if (!bluetoothService) {
    bluetoothService = new BluetoothService()
  }
  return bluetoothService
}
