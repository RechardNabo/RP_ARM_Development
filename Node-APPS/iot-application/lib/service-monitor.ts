// This is a simulated service monitor for the CM4-IO-WIRELESS-BASE
// In a real application, you would use the systeminformation npm package or similar

export interface ServiceStatus {
  name: string
  status: "running" | "stopped" | "error" | "unknown"
  pid?: number
  memory?: number
  cpu?: number
  uptime?: number
  port?: number
  lastUpdated: number
}

export interface SystemInterface {
  name: string
  type: "spi" | "i2c" | "can" | "uart" | "gpio"
  status: "active" | "inactive" | "error"
  details?: Record<string, any>
  lastUpdated: number
}

export class ServiceMonitor {
  private services: ServiceStatus[] = []
  private interfaces: SystemInterface[] = []
  private updateInterval: NodeJS.Timeout | null = null

  constructor() {
    // Initialize with some sample services
    this.services = [
      {
        name: "mongodb",
        status: "running",
        pid: 1234,
        memory: 256.5,
        cpu: 2.3,
        uptime: 86400,
        port: 27017,
        lastUpdated: Date.now(),
      },
      {
        name: "influxd",
        status: "running",
        pid: 1235,
        memory: 128.7,
        cpu: 1.5,
        uptime: 172800,
        port: 8086,
        lastUpdated: Date.now(),
      },
      {
        name: "grafana-server",
        status: "running",
        pid: 1236,
        memory: 98.2,
        cpu: 0.8,
        uptime: 86400,
        port: 3000,
        lastUpdated: Date.now(),
      },
      {
        name: "webmin",
        status: "running",
        pid: 1237,
        memory: 45.6,
        cpu: 0.2,
        uptime: 259200,
        port: 10000,
        lastUpdated: Date.now(),
      },
      {
        name: "nginx",
        status: "running",
        pid: 1238,
        memory: 32.1,
        cpu: 0.3,
        uptime: 172800,
        port: 80,
        lastUpdated: Date.now(),
      },
    ]

    // Initialize with some sample interfaces
    this.interfaces = [
      {
        name: "SPI0",
        type: "spi",
        status: "active",
        details: {
          speed: "10 MHz",
          mode: 0,
          devices: 2,
        },
        lastUpdated: Date.now(),
      },
      {
        name: "I2C1",
        type: "i2c",
        status: "active",
        details: {
          speed: "400 kHz",
          devices: 4,
        },
        lastUpdated: Date.now(),
      },
      {
        name: "CAN0",
        type: "can",
        status: "inactive",
        details: {
          bitrate: "500 kbit/s",
        },
        lastUpdated: Date.now(),
      },
      {
        name: "UART0",
        type: "uart",
        status: "active",
        details: {
          baudrate: "115200",
          parity: "none",
          databits: 8,
          stopbits: 1,
        },
        lastUpdated: Date.now(),
      },
      {
        name: "GPIO",
        type: "gpio",
        status: "active",
        details: {
          pins: 40,
          used: 8,
        },
        lastUpdated: Date.now(),
      },
    ]
  }

  startMonitoring(interval = 5000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    this.updateInterval = setInterval(() => {
      this.updateServiceStatus()
      this.updateInterfaceStatus()
    }, interval)

    console.log(`Service monitoring started with interval of ${interval}ms`)
  }

  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
      console.log("Service monitoring stopped")
    }
  }

  getServiceStatus(name?: string): ServiceStatus | ServiceStatus[] {
    if (name) {
      return (
        this.services.find((service) => service.name === name) || {
          name,
          status: "unknown",
          lastUpdated: Date.now(),
        }
      )
    }

    return [...this.services]
  }

  getInterfaceStatus(name?: string): SystemInterface | SystemInterface[] {
    if (name) {
      return (
        this.interfaces.find((iface) => iface.name === name) ||
        ({
          name,
          type: "gpio",
          status: "unknown",
          lastUpdated: Date.now(),
        } as SystemInterface)
      )
    }

    return [...this.interfaces]
  }

  async restartService(name: string): Promise<boolean> {
    return new Promise((resolve) => {
      const service = this.services.find((s) => s.name === name)
      if (!service) {
        console.log(`Service ${name} not found`)
        resolve(false)
        return
      }

      // Simulate service restart
      console.log(`Restarting service ${name}...`)
      service.status = "stopped"

      setTimeout(() => {
        service.status = "running"
        service.uptime = 0
        service.lastUpdated = Date.now()
        console.log(`Service ${name} restarted successfully`)
        resolve(true)
      }, 2000)
    })
  }

  async enableInterface(name: string): Promise<boolean> {
    return new Promise((resolve) => {
      const iface = this.interfaces.find((i) => i.name === name)
      if (!iface) {
        console.log(`Interface ${name} not found`)
        resolve(false)
        return
      }

      // Simulate interface enabling
      console.log(`Enabling interface ${name}...`)

      setTimeout(() => {
        iface.status = "active"
        iface.lastUpdated = Date.now()
        console.log(`Interface ${name} enabled successfully`)
        resolve(true)
      }, 1000)
    })
  }

  async disableInterface(name: string): Promise<boolean> {
    return new Promise((resolve) => {
      const iface = this.interfaces.find((i) => i.name === name)
      if (!iface) {
        console.log(`Interface ${name} not found`)
        resolve(false)
        return
      }

      // Simulate interface disabling
      console.log(`Disabling interface ${name}...`)

      setTimeout(() => {
        iface.status = "inactive"
        iface.lastUpdated = Date.now()
        console.log(`Interface ${name} disabled successfully`)
        resolve(true)
      }, 1000)
    })
  }

  private updateServiceStatus(): void {
    // Simulate updating service status
    this.services.forEach((service) => {
      // Randomly update CPU and memory usage
      service.cpu = Math.max(0.1, Math.min(100, service.cpu! + (Math.random() * 2 - 1)))
      service.memory = Math.max(10, Math.min(1024, service.memory! + (Math.random() * 10 - 5)))

      // Increment uptime
      service.uptime! += 5

      // Occasionally change status
      if (Math.random() > 0.98) {
        service.status = service.status === "running" ? "error" : "running"
      }

      service.lastUpdated = Date.now()
    })
  }

  private updateInterfaceStatus(): void {
    // Simulate updating interface status
    this.interfaces.forEach((iface) => {
      // Occasionally change status
      if (Math.random() > 0.95) {
        iface.status = iface.status === "active" ? "inactive" : "active"
      }

      // Update details based on interface type
      if (iface.type === "i2c" && iface.details) {
        iface.details.devices = Math.floor(Math.random() * 6) + 1
      } else if (iface.type === "spi" && iface.details) {
        iface.details.devices = Math.floor(Math.random() * 3) + 1
      }

      iface.lastUpdated = Date.now()
    })
  }
}

// Create a singleton instance
let serviceMonitor: ServiceMonitor | null = null

export function getServiceMonitor(): ServiceMonitor {
  if (!serviceMonitor) {
    serviceMonitor = new ServiceMonitor()
    serviceMonitor.startMonitoring()
  }
  return serviceMonitor
}
