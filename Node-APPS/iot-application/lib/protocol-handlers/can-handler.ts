// This is a simulated CAN protocol handler for the CM4-IO-WIRELESS-BASE
// In a real application, you would use the socketcan npm package or similar

export interface CANMessage {
  id: number
  ext?: boolean
  rtr?: boolean
  data: Buffer
  timestamp: number
}

export interface CANStats {
  rxFrames: number
  txFrames: number
  rxErrors: number
  txErrors: number
  rxOverflows: number
  txDropped: number
}

export class CANHandler {
  private interface: string
  private isOpen = false
  private stats: CANStats = {
    rxFrames: 0,
    txFrames: 0,
    rxErrors: 0,
    txErrors: 0,
    rxOverflows: 0,
    txDropped: 0,
  }
  private messageListeners: ((message: CANMessage) => void)[] = []
  private errorListeners: ((error: Error) => void)[] = []
  private simulationInterval: NodeJS.Timeout | null = null

  constructor(interfaceName = "can0") {
    this.interface = interfaceName
  }

  async open(bitrate = 500000): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate opening the CAN interface
      setTimeout(() => {
        this.isOpen = true
        console.log(`CAN interface ${this.interface} opened at ${bitrate} bit/s`)

        // Start simulating incoming CAN messages
        this.startSimulation()

        resolve(true)
      }, 200)
    })
  }

  async close(): Promise<boolean> {
    return new Promise((resolve) => {
      // Stop simulation
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval)
        this.simulationInterval = null
      }

      // Simulate closing the CAN interface
      setTimeout(() => {
        this.isOpen = false
        console.log(`CAN interface ${this.interface} closed`)
        resolve(true)
      }, 100)
    })
  }

  async send(id: number, data: Buffer, ext = false, rtr = false): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        reject(new Error(`CAN interface ${this.interface} not open`))
        return
      }

      // Simulate sending a CAN message
      setTimeout(() => {
        this.stats.txFrames++
        console.log(`Sent CAN message: ID=0x${id.toString(16)}, Data=${data.toString("hex")}, ext=${ext}, rtr=${rtr}`)
        resolve(true)
      }, 10)
    })
  }

  onMessage(callback: (message: CANMessage) => void): void {
    this.messageListeners.push(callback)
  }

  onError(callback: (error: Error) => void): void {
    this.errorListeners.push(callback)
  }

  getStats(): CANStats {
    return { ...this.stats }
  }

  isInterfaceOpen(): boolean {
    return this.isOpen
  }

  private startSimulation(): void {
    // Simulate receiving CAN messages at random intervals
    this.simulationInterval = setInterval(() => {
      if (!this.isOpen) return

      // Randomly decide whether to generate a message
      if (Math.random() > 0.7) {
        // Generate a random CAN message
        const id = Math.floor(Math.random() * 0x7ff) // Standard CAN ID (11-bit)
        const length = Math.floor(Math.random() * 8) + 1 // 1-8 bytes
        const data = Buffer.alloc(length)

        // Fill with random data
        for (let i = 0; i < length; i++) {
          data[i] = Math.floor(Math.random() * 256)
        }

        const message: CANMessage = {
          id,
          data,
          timestamp: Date.now(),
        }

        // Notify listeners
        this.stats.rxFrames++
        this.messageListeners.forEach((listener) => listener(message))
      }

      // Occasionally simulate an error
      if (Math.random() > 0.95) {
        this.stats.rxErrors++
        const error = new Error(`CAN error: ${Math.random() > 0.5 ? "Bus off" : "Overflow"}`)
        this.errorListeners.forEach((listener) => listener(error))
      }
    }, 500) // Check every 500ms
  }
}

// Create a singleton instance
let canHandler: CANHandler | null = null

export function getCANHandler(interfaceName = "can0"): CANHandler {
  if (!canHandler) {
    canHandler = new CANHandler(interfaceName)
  }
  return canHandler
}
