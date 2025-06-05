import { create } from "zustand"

export interface Device {
  id: string
  name: string
  type: string
  protocol: string
  status: "online" | "offline" | "warning" | "error"
  lastSeen: string
  value?: string
  battery?: string
  ipAddress?: string
  macAddress?: string
  location?: string
  manufacturer?: string
  model?: string
  firmware?: string
  settings?: Record<string, any>
  dataTypes?: Array<{
    name: string
    type: string
    unit: string
    min?: number
    max?: number
  }>
}

interface DeviceState {
  devices: Device[]
  addDevice: (device: Device) => void
  updateDevice: (id: string, updates: Partial<Device>) => void
  removeDevice: (id: string) => void
  getDeviceById: (id: string) => Device | undefined
  getDevicesByProtocol: (protocol: string) => Device[]
  getDevicesByType: (type: string) => Device[]
  getDevicesByStatus: (status: Device["status"]) => Device[]
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [
    {
      id: "dev-001",
      name: "Temperature Sensor",
      type: "sensor",
      protocol: "I2C",
      status: "online",
      lastSeen: "2 minutes ago",
      value: "24.5°C",
      battery: "95%",
      ipAddress: "N/A",
      macAddress: "N/A",
      location: "Server Room",
      manufacturer: "Bosch",
      model: "BME280",
      firmware: "1.2.0",
      settings: {
        address: "0x76",
        bus: "1",
        interval: 5000,
      },
      dataTypes: [
        {
          name: "temperature",
          type: "float",
          unit: "°C",
          min: -40,
          max: 85,
        },
        {
          name: "humidity",
          type: "float",
          unit: "%",
          min: 0,
          max: 100,
        },
        {
          name: "pressure",
          type: "float",
          unit: "hPa",
          min: 300,
          max: 1100,
        },
      ],
    },
    {
      id: "dev-002",
      name: "Pressure Sensor",
      type: "sensor",
      protocol: "SPI",
      status: "online",
      lastSeen: "5 minutes ago",
      value: "1013.2 hPa",
      battery: "87%",
      location: "Outdoor",
      manufacturer: "Texas Instruments",
      model: "BMP180",
      firmware: "2.1.0",
      settings: {
        bus: "0",
        chipSelect: "0",
        speed: "1000000",
      },
      dataTypes: [
        {
          name: "pressure",
          type: "float",
          unit: "hPa",
          min: 300,
          max: 1100,
        },
        {
          name: "temperature",
          type: "float",
          unit: "°C",
          min: -40,
          max: 85,
        },
      ],
    },
    {
      id: "dev-003",
      name: "Smart Light Controller",
      type: "actuator",
      protocol: "Wi-Fi",
      status: "online",
      lastSeen: "1 minute ago",
      value: "On (75%)",
      battery: "N/A",
      ipAddress: "192.168.1.120",
      macAddress: "AA:BB:CC:DD:EE:FF",
      location: "Living Room",
      manufacturer: "Philips",
      model: "Hue Bridge",
      firmware: "1.45.0",
      settings: {
        brightness: 75,
        color: "#FFFFFF",
        colorTemp: 4000,
      },
    },
  ],

  addDevice: (device) =>
    set((state) => ({
      devices: [...state.devices, device],
    })),

  updateDevice: (id, updates) =>
    set((state) => ({
      devices: state.devices.map((device) => (device.id === id ? { ...device, ...updates } : device)),
    })),

  removeDevice: (id) =>
    set((state) => ({
      devices: state.devices.filter((device) => device.id !== id),
    })),

  getDeviceById: (id) => {
    return get().devices.find((device) => device.id === id)
  },

  getDevicesByProtocol: (protocol) => {
    return get().devices.filter((device) => device.protocol === protocol)
  },

  getDevicesByType: (type) => {
    return get().devices.filter((device) => device.type === type)
  },

  getDevicesByStatus: (status) => {
    return get().devices.filter((device) => device.status === status)
  },
}))
