// CAN interface service for the CM4-IO-WIRELESS-BASE
import { exec, spawn } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export interface CANMessage {
  id: number
  data: Buffer
  timestamp: number
  extended?: boolean
  rtr?: boolean
}

export interface CANStats {
  rxPackets: number
  txPackets: number
  rxErrors: number
  txErrors: number
  rxDropped: number
  txDropped: number
}

export class CANInterface {
  private static instance: CANInterface
  private interface: string
  private isInitialized = false
  private messageListeners: ((message: CANMessage) => void)[] = []
  private canProcess: any = null

  private constructor(interfaceName = "can0") {
    this.interface = interfaceName
  }

  public static getInstance(interfaceName = "can0"): CANInterface {
    if (!CANInterface.instance) {
      CANInterface.instance = new CANInterface(interfaceName)
    }
    return CANInterface.instance
  }

  public async initialize(bitrate = 500000): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log(`CAN interface ${this.interface} already initialized`)
        return true
      }

      // Check if the interface exists
      const { stdout: ifconfigOutput } = await execAsync(`ifconfig ${this.interface}`)
      if (!ifconfigOutput.includes(this.interface)) {
        console.error(`CAN interface ${this.interface} not found`)
        return false
      }

      // Check if the interface is already up
      if (ifconfigOutput.includes("UP") && ifconfigOutput.includes("RUNNING")) {
        console.log(`CAN interface ${this.interface} is already up and running`)
        this.isInitialized = true
        return true
      }

      // Set up the CAN interface
      await execAsync(`sudo ip link set ${this.interface} down`)
      await execAsync(`sudo ip link set ${this.interface} type can bitrate ${bitrate}`)
      await execAsync(`sudo ip link set ${this.interface} up`)

      console.log(`CAN interface ${this.interface} initialized with bitrate ${bitrate}`)
      this.isInitialized = true
      return true
    } catch (error) {
      console.error(`Failed to initialize CAN interface ${this.interface}:`, error)
      return false
    }
  }

  public async shutdown(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.log(`CAN interface ${this.interface} is not initialized`)
        return true
      }

      if (this.canProcess) {
        this.canProcess.kill()
        this.canProcess = null
      }

      await execAsync(`sudo ip link set ${this.interface} down`)
      console.log(`CAN interface ${this.interface} shut down`)
      this.isInitialized = false
      return true
    } catch (error) {
      console.error(`Failed to shut down CAN interface ${this.interface}:`, error)
      return false
    }
  }

  public async getStats(): Promise<CANStats | null> {
    try {
      if (!this.isInitialized) {
        console.error(`CAN interface ${this.interface} is not initialized`)
        return null
      }

      const { stdout } = await execAsync(`ifconfig ${this.interface}`)

      // Parse the output to extract statistics
      const rxPackets = this.extractNumber(stdout, "RX packets")
      const txPackets = this.extractNumber(stdout, "TX packets")
      const rxErrors = this.extractNumber(stdout, "RX errors")
      const txErrors = this.extractNumber(stdout, "TX errors")
      const rxDropped = this.extractNumber(stdout, "dropped", "RX")
      const txDropped = this.extractNumber(stdout, "dropped", "TX")

      return {
        rxPackets,
        txPackets,
        rxErrors,
        txErrors,
        rxDropped,
        txDropped,
      }
    } catch (error) {
      console.error(`Failed to get stats for CAN interface ${this.interface}:`, error)
      return null
    }
  }

  private extractNumber(text: string, pattern: string, section?: string): number {
    try {
      let regex
      if (section) {
        // If a section is specified, look for the pattern within that section
        const sectionRegex = new RegExp(`${section}[^\\n]*${pattern}\\s+(\\d+)`)
        const match = text.match(sectionRegex)
        return match ? Number.parseInt(match[1], 10) : 0
      } else {
        // Otherwise, look for the pattern anywhere in the text
        regex = new RegExp(`${pattern}\\s+(\\d+)`)
        const match = text.match(regex)
        return match ? Number.parseInt(match[1], 10) : 0
      }
    } catch (error) {
      console.error(`Error extracting number for pattern ${pattern}:`, error)
      return 0
    }
  }

  public async sendMessage(id: number, data: Buffer | number[], extended = false, rtr = false): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.error(`CAN interface ${this.interface} is not initialized`)
        return false
      }

      // Convert number array to Buffer if needed
      if (Array.isArray(data)) {
        data = Buffer.from(data)
      }

      // Format the data as a hex string
      const dataHex =
        data
          .toString("hex")
          .match(/.{1,2}/g)
          ?.join(" ") || ""

      // Build the cansend command
      let command = `cansend ${this.interface} `

      if (extended) {
        command += `${id.toString(16).padStart(8, "0")}#`
      } else {
        command += `${id.toString(16).padStart(3, "0")}#`
      }

      if (rtr) {
        command += "R"
      } else {
        command += dataHex
      }

      await execAsync(command)
      return true
    } catch (error) {
      console.error(`Failed to send CAN message on interface ${this.interface}:`, error)
      return false
    }
  }

  public startListening(): boolean {
    if (!this.isInitialized) {
      console.error(`CAN interface ${this.interface} is not initialized`)
      return false
    }

    if (this.canProcess) {
      console.log("Already listening for CAN messages")
      return true
    }

    try {
      // Start candump process to listen for CAN messages
      this.canProcess = spawn("candump", [this.interface])

      this.canProcess.stdout.on("data", (data: Buffer) => {
        const lines = data.toString().trim().split("\n")

        for (const line of lines) {
          try {
            // Parse candump output format: can0 123#DEADBEEF
            const match = line.match(/\s*(\w+)\s+([0-9A-F]+)#([0-9A-F]+)/i)
            if (match) {
              const [, iface, idStr, dataStr] = match

              if (iface === this.interface) {
                const id = Number.parseInt(idStr, 16)
                const data = Buffer.from(dataStr.replace(/\s+/g, ""), "hex")

                const message: CANMessage = {
                  id,
                  data,
                  timestamp: Date.now(),
                  extended: idStr.length > 3,
                  rtr: false,
                }

                // Notify all listeners
                this.messageListeners.forEach((listener) => listener(message))
              }
            }
          } catch (error) {
            console.error("Error parsing CAN message:", error)
          }
        }
      })

      this.canProcess.stderr.on("data", (data: Buffer) => {
        console.error(`candump error: ${data.toString()}`)
      })

      this.canProcess.on("close", (code: number) => {
        console.log(`candump process exited with code ${code}`)
        this.canProcess = null
      })

      console.log(`Started listening for CAN messages on ${this.interface}`)
      return true
    } catch (error) {
      console.error(`Failed to start listening for CAN messages on ${this.interface}:`, error)
      return false
    }
  }

  public stopListening(): boolean {
    if (this.canProcess) {
      this.canProcess.kill()
      this.canProcess = null
      console.log(`Stopped listening for CAN messages on ${this.interface}`)
      return true
    }
    return false
  }

  public onMessage(callback: (message: CANMessage) => void): void {
    this.messageListeners.push(callback)
  }

  public removeMessageListener(callback: (message: CANMessage) => void): void {
    const index = this.messageListeners.indexOf(callback)
    if (index !== -1) {
      this.messageListeners.splice(index, 1)
    }
  }

  public isInterfaceInitialized(): boolean {
    return this.isInitialized
  }
}

// Create a singleton instance
let canInterface: CANInterface | null = null

export function getCANInterface(interfaceName = "can0"): CANInterface {
  if (!canInterface) {
    canInterface = CANInterface.getInstance(interfaceName)
  }
  return canInterface
}
