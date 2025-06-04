/**
 * Mock data provider for v0 preview environment
 * This file provides mock data for all MongoDB-dependent components
 */

// Mock service statuses for preview environment
export function getMockServicesStatus() {
  return [
    { name: "MongoDB", status: "Running", type: "database" },
    { name: "InfluxDB", status: "Running", type: "database" },
    { name: "Grafana", status: "Running", type: "monitoring" },
    { name: "Nginx", status: "Running", type: "web" },
    { name: "Webmin", status: "Running", type: "system" },
    { name: "SPI", status: "Active", type: "interface" },
    { name: "I2C", status: "Active", type: "interface" },
    { name: "CAN0", status: "Active", type: "interface" },
  ];
}

// Mock device data
export const mockDevices = [
  {
    id: "device-001",
    name: "Temperature Sensor 1",
    type: "sensor",
    status: "online",
    lastSeen: new Date().toISOString(),
    location: "Server Room",
    protocol: "mqtt",
    readings: {
      temperature: 24.5,
      humidity: 45,
      battery: 87,
    },
  },
  {
    id: "device-002",
    name: "Humidity Sensor 1",
    type: "sensor",
    status: "online",
    lastSeen: new Date().toISOString(),
    location: "Office",
    protocol: "bluetooth",
    readings: {
      temperature: 22.3,
      humidity: 50,
      battery: 92,
    },
  },
  {
    id: "device-003",
    name: "Gateway 1",
    type: "gateway",
    status: "warning",
    lastSeen: new Date().toISOString(),
    location: "Hallway",
    protocol: "zigbee",
    readings: {
      temperature: 23.1,
      humidity: 48,
      battery: 65,
    },
  },
  {
    id: "device-004",
    name: "Control Panel",
    type: "controller",
    status: "offline",
    lastSeen: new Date(Date.now() - 86400000).toISOString(),
    location: "Reception",
    protocol: "modbus",
    readings: {
      temperature: null,
      humidity: null,
      battery: 0,
    },
  },
]

// Mock sensor readings
export const mockSensorReadings = {
  temperature: Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    value: 22 + Math.random() * 3,
  })),
  humidity: Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    value: 45 + Math.random() * 10,
  })),
  pressure: Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    value: 1010 + Math.random() * 5,
  })),
}

// Mock alerts
export const mockAlerts = [
  {
    id: "alert-001",
    deviceId: "device-003",
    type: "warning",
    message: "Battery level low",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert-002",
    deviceId: "device-004",
    type: "critical",
    message: "Device offline",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    acknowledged: true,
  },
  {
    id: "alert-003",
    deviceId: "device-001",
    type: "info",
    message: "Firmware update available",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    acknowledged: false,
  },
]

// Mock system status
export function getMockHardwareStatus() {
  return {
    can: {
      initialized: true,
      stats: {
        rxPackets: Math.floor(Math.random() * 1000),
        txPackets: Math.floor(Math.random() * 1000),
        rxErrors: Math.floor(Math.random() * 10),
        txErrors: Math.floor(Math.random() * 10),
        rxDropped: Math.floor(Math.random() * 5),
        txDropped: Math.floor(Math.random() * 5),
      },
    },
    wifi: {
      initialized: true,
      status: {
        connected: true,
        ssid: "Preview_Network",
        ipAddress: "192.168.1.100",
        macAddress: "00:11:22:33:44:55",
        signalStrength: -65,
        bitrate: 300,
      },
    },
    mongodb: {
      connected: true,
    },
    influxdb: {
      connected: true,
    },
    grafana: {
      connected: true,
    },
  }
}

// Mock user data
export const mockUsers = [
  {
    id: "user-001",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    lastLogin: new Date().toISOString(),
  },
  {
    id: "user-002",
    name: "Regular User",
    email: "user@example.com",
    role: "user",
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
  },
]

// Mock logs
export const mockLogs = Array.from({ length: 50 }, (_, i) => ({
  id: `log-${i.toString().padStart(3, "0")}`,
  level: ["info", "warning", "error"][Math.floor(Math.random() * 3)],
  message: `System ${["started", "updated", "error", "warning", "notification"][Math.floor(Math.random() * 5)]} event`,
  timestamp: new Date(Date.now() - i * 900000).toISOString(),
  source: ["system", "device", "user", "network"][Math.floor(Math.random() * 4)],
}))

// Function to get mock data by type
export function getMockData(type: string) {
  switch (type) {
    case "devices":
      return mockDevices
    case "readings":
      return mockSensorReadings
    case "alerts":
      return mockAlerts
    case "status":
      return getMockHardwareStatus()
    case "users":
      return mockUsers
    case "logs":
      return mockLogs
    default:
      return null
  }
}

export function getMockDeviceData() {
  return mockDevices
}

export function getMockSensorData(hours: number) {
  const now = new Date()
  return {
    temperature: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now.getTime() - i * 3600000).toISOString(),
      value: 22 + Math.random() * 3,
    })),
    humidity: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now.getTime() - i * 3600000).toISOString(),
      value: 45 + Math.random() * 10,
    })),
    pressure: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now.getTime() - i * 3600000).toISOString(),
      value: 1010 + Math.random() * 5,
    })),
  }
}
