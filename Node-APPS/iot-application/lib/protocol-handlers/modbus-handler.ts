// This is a simulated Modbus protocol handler for the CM4-IO-WIRELESS-BASE
// In a real application, you would use the modbus-serial npm package or similar

export interface ModbusRegister {
  address: number
  value: number
  type: "coil" | "discrete" | "holding" | "input"
  description?: string
}

export interface ModbusDevice {
  id: number
  name: string
  registers: ModbusRegister[]
  connected: boolean
}

export class ModbusHandler {
  private port: string
  private baudRate: number
  private isOpen = false
  private devices: ModbusDevice[] = []

  constructor(port = "/dev/ttyS0", baudRate = 9600) {
    this.port = port
    this.baudRate = baudRate

    // Add some sample Modbus devices
    this.devices = [
      {
        id: 1,
        name: "Temperature Controller",
        connected: true,
        registers: [
          { address: 0, value: 245, type: "holding", description: "Current Temperature (x10)" },
          { address: 1, value: 250, type: "holding", description: "Target Temperature (x10)" },
          { address: 2, value: 1, type: "coil", description: "Heater Status" },
          { address: 3, value: 0, type: "coil", description: "Alarm Status" },
        ],
      },
      {
        id: 2,
        name: "Flow Meter",
        connected: true,
        registers: [
          { address: 0, value: 230, type: "input", description: "Flow Rate (x10 L/min)" },
          { address: 1, value: 10567, type: "input", description: "Total Flow (L)" },
          { address: 2, value: 0, type: "discrete", description: "Flow Detected" },
        ],
      },
      {
        id: 3,
        name: "Motor Drive",
        connected: false,
        registers: [
          { address: 0, value: 0, type: "holding", description: "Speed (RPM)" },
          { address: 1, value: 0, type: "holding", description: "Direction (0=FWD, 1=REV)" },
          { address: 2, value: 0, type: "coil", description: "Run Status" },
          { address: 3, value: 0, type: "coil", description: "Fault Status" },
        ],
      },
    ]
  }

  async open(): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate opening the Modbus RTU port
      setTimeout(() => {
        this.isOpen = true
        console.log(`Modbus RTU port ${this.port} opened at ${this.baudRate} baud`)
        resolve(true)
      }, 300)
    })
  }

  async close(): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate closing the Modbus RTU port
      setTimeout(() => {
        this.isOpen = false
        console.log(`Modbus RTU port ${this.port} closed`)
        resolve(true)
      }, 100)
    })
  }

  async readHoldingRegisters(deviceId: number, address: number, length: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        reject(new Error("Modbus port not open"))
        return
      }

      // Find the device
      const device = this.devices.find((d) => d.id === deviceId)
      if (!device) {
        reject(new Error(`Modbus device with ID ${deviceId} not found`))
        return
      }

      if (!device.connected) {
        reject(new Error(`Modbus device with ID ${deviceId} is not connected`))
        return
      }

      // Simulate reading holding registers
      setTimeout(() => {
        const values: number[] = []

        for (let i = 0; i < length; i++) {
          const register = device.registers.find((r) => r.address === address + i && r.type === "holding")
          if (register) {
            values.push(register.value)
          } else {
            values.push(0) // Default value if register not found
          }
        }

        console.log(`Read ${length} holding registers from device ${deviceId} starting at address ${address}`)
        resolve(values)
      }, 100)
    })
  }

  async readInputRegisters(deviceId: number, address: number, length: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        reject(new Error("Modbus port not open"))
        return
      }

      // Find the device
      const device = this.devices.find((d) => d.id === deviceId)
      if (!device) {
        reject(new Error(`Modbus device with ID ${deviceId} not found`))
        return
      }

      if (!device.connected) {
        reject(new Error(`Modbus device with ID ${deviceId} is not connected`))
        return
      }

      // Simulate reading input registers
      setTimeout(() => {
        const values: number[] = []

        for (let i = 0; i < length; i++) {
          const register = device.registers.find((r) => r.address === address + i && r.type === "input")
          if (register) {
            values.push(register.value)
          } else {
            values.push(0) // Default value if register not found
          }
        }

        console.log(`Read ${length} input registers from device ${deviceId} starting at address ${address}`)
        resolve(values)
      }, 100)
    })
  }

  async readCoils(deviceId: number, address: number, length: number): Promise<boolean[]> {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        reject(new Error("Modbus port not open"))
        return
      }

      // Find the device
      const device = this.devices.find((d) => d.id === deviceId)
      if (!device) {
        reject(new Error(`Modbus device with ID ${deviceId} not found`))
        return
      }

      if (!device.connected) {
        reject(new Error(`Modbus device with ID ${deviceId} is not connected`))
        return
      }

      // Simulate reading coils
      setTimeout(() => {
        const values: boolean[] = []

        for (let i = 0; i < length; i++) {
          const register = device.registers.find((r) => r.address === address + i && r.type === "coil")
          if (register) {
            values.push(register.value === 1)
          } else {
            values.push(false) // Default value if register not found
          }
        }

        console.log(`Read ${length} coils from device ${deviceId} starting at address ${address}`)
        resolve(values)
      }, 100)
    })
  }

  async writeHoldingRegister(deviceId: number, address: number, value: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        reject(new Error("Modbus port not open"))
        return
      }

      // Find the device
      const device = this.devices.find((d) => d.id === deviceId)
      if (!device) {
        reject(new Error(`Modbus device with ID ${deviceId} not found`))
        return
      }

      if (!device.connected) {
        reject(new Error(`Modbus device with ID ${deviceId} is not connected`))
        return
      }

      // Simulate writing to a holding register
      setTimeout(() => {
        const register = device.registers.find((r) => r.address === address && r.type === "holding")
        if (register) {
          register.value = value
          console.log(`Wrote value ${value} to holding register ${address} on device ${deviceId}`)
          resolve(true)
        } else {
          // Add a new register if it doesn't exist
          device.registers.push({
            address,
            value,
            type: "holding",
          })
          console.log(`Created and wrote value ${value} to holding register ${address} on device ${deviceId}`)
          resolve(true)
        }
      }, 100)
    })
  }

  async writeCoil(deviceId: number, address: number, value: boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        reject(new Error("Modbus port not open"))
        return
      }

      // Find the device
      const device = this.devices.find((d) => d.id === deviceId)
      if (!device) {
        reject(new Error(`Modbus device with ID ${deviceId} not found`))
        return
      }

      if (!device.connected) {
        reject(new Error(`Modbus device with ID ${deviceId} is not connected`))
        return
      }

      // Simulate writing to a coil
      setTimeout(() => {
        const register = device.registers.find((r) => r.address === address && r.type === "coil")
        if (register) {
          register.value = value ? 1 : 0
          console.log(`Wrote value ${value ? 1 : 0} to coil ${address} on device ${deviceId}`)
          resolve(true)
        } else {
          // Add a new register if it doesn't exist
          device.registers.push({
            address,
            value: value ? 1 : 0,
            type: "coil",
          })
          console.log(`Created and wrote value ${value ? 1 : 0} to coil ${address} on device ${deviceId}`)
          resolve(true)
        }
      }, 100)
    })
  }

  getDevices(): ModbusDevice[] {
    return [...this.devices]
  }

  isPortOpen(): boolean {
    return this.isOpen
  }
}

// Create a singleton instance
let modbusHandler: ModbusHandler | null = null

export function getModbusHandler(port = "/dev/ttyS0", baudRate = 9600): ModbusHandler {
  if (!modbusHandler) {
    modbusHandler = new ModbusHandler(port, baudRate)
  }
  return modbusHandler
}
