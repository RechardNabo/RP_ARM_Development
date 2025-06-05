// This is a simulated I2C protocol handler for the CM4-IO-WIRELESS-BASE
// In a real application, you would use the i2c-bus npm package or similar

export interface I2CDevice {
  address: number
  bus: number
  name: string
  description?: string
}

export interface I2CReadResult {
  buffer: Buffer
  bytesRead: number
  timestamp: number
}

export class I2CHandler {
  private devices: I2CDevice[] = []
  private isOpen = false
  private busNumber = 1

  constructor(busNumber = 1) {
    this.busNumber = busNumber

    // Add some sample devices that would be found on a typical I2C bus
    this.devices = [
      { address: 0x76, bus: 1, name: "BME280", description: "Temperature/Humidity/Pressure Sensor" },
      { address: 0x68, bus: 1, name: "DS3231", description: "Real-Time Clock" },
      { address: 0x40, bus: 1, name: "INA219", description: "Current/Voltage Sensor" },
      { address: 0x48, bus: 1, name: "ADS1115", description: "16-bit ADC" },
      { address: 0x50, bus: 1, name: "AT24C32", description: "EEPROM" },
    ]
  }

  async open(): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate opening the I2C bus
      setTimeout(() => {
        this.isOpen = true
        console.log(`I2C bus ${this.busNumber} opened`)
        resolve(true)
      }, 100)
    })
  }

  async close(): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate closing the I2C bus
      setTimeout(() => {
        this.isOpen = false
        console.log(`I2C bus ${this.busNumber} closed`)
        resolve(true)
      }, 100)
    })
  }

  async scan(): Promise<number[]> {
    return new Promise((resolve) => {
      if (!this.isOpen) {
        throw new Error("I2C bus not open")
      }

      // Simulate scanning the I2C bus for devices
      setTimeout(() => {
        const addresses = this.devices.filter((device) => device.bus === this.busNumber).map((device) => device.address)

        console.log(`Found ${addresses.length} devices on I2C bus ${this.busNumber}`)
        resolve(addresses)
      }, 500)
    })
  }

  async read(address: number, length: number): Promise<I2CReadResult> {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        reject(new Error("I2C bus not open"))
        return
      }

      // Check if the device exists
      const device = this.devices.find((d) => d.address === address && d.bus === this.busNumber)
      if (!device) {
        reject(new Error(`No device found at address 0x${address.toString(16)}`))
        return
      }

      // Simulate reading from the I2C device
      setTimeout(() => {
        // Generate random data based on the device type
        const buffer = Buffer.alloc(length)

        if (device.name === "BME280") {
          // Simulate temperature, humidity, pressure data
          // Temperature (2 bytes): 20-30°C in fixed-point format
          const temp = 20 + Math.random() * 10
          buffer.writeInt16LE(Math.round(temp * 100), 0)

          // Humidity (2 bytes): 30-70% in fixed-point format
          const humidity = 30 + Math.random() * 40
          buffer.writeUInt16LE(Math.round(humidity * 100), 2)

          // Pressure (4 bytes): 900-1100 hPa in fixed-point format
          const pressure = 900 + Math.random() * 200
          buffer.writeUInt32LE(Math.round(pressure * 100), 4)
        } else if (device.name === "DS3231") {
          // Simulate RTC data
          const now = new Date()
          buffer[0] = now.getSeconds()
          buffer[1] = now.getMinutes()
          buffer[2] = now.getHours()
          buffer[3] = now.getDay() + 1
          buffer[4] = now.getDate()
          buffer[5] = now.getMonth() + 1
          buffer[6] = now.getFullYear() - 2000
        } else {
          // Generic random data
          for (let i = 0; i < length; i++) {
            buffer[i] = Math.floor(Math.random() * 256)
          }
        }

        resolve({
          buffer,
          bytesRead: length,
          timestamp: Date.now(),
        })
      }, 100)
    })
  }

  async write(address: number, buffer: Buffer): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        reject(new Error("I2C bus not open"))
        return
      }

      // Check if the device exists
      const device = this.devices.find((d) => d.address === address && d.bus === this.busNumber)
      if (!device) {
        reject(new Error(`No device found at address 0x${address.toString(16)}`))
        return
      }

      // Simulate writing to the I2C device
      setTimeout(() => {
        console.log(`Wrote ${buffer.length} bytes to I2C device at address 0x${address.toString(16)}`)
        resolve(buffer.length)
      }, 100)
    })
  }

  getDevices(): I2CDevice[] {
    return this.devices.filter((device) => device.bus === this.busNumber)
  }

  isDeviceAvailable(address: number): boolean {
    return this.devices.some((device) => device.address === address && device.bus === this.busNumber)
  }
}

// Create a singleton instance
let i2cHandler: I2CHandler | null = null

export function getI2CHandler(busNumber = 1): I2CHandler {
  if (!i2cHandler) {
    i2cHandler = new I2CHandler(busNumber)
  }
  return i2cHandler
}
