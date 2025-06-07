// This is a simulated MQTT client for the frontend
// In a real application, you would use a library like mqtt.js

export interface MQTTMessage {
  topic: string
  payload: string
  qos: number
  retain: boolean
  timestamp: number
}

export interface MQTTClientOptions {
  clientId: string
  host: string
  port: number
  username?: string
  password?: string
  ssl?: boolean
}

export class MQTTClient {
  private connected = false
  private options: MQTTClientOptions
  private messageListeners: ((message: MQTTMessage) => void)[] = []
  private connectionListeners: ((connected: boolean) => void)[] = []
  private simulatedMessages: MQTTMessage[] = []
  private interval: NodeJS.Timeout | null = null

  constructor(options: MQTTClientOptions) {
    this.options = options

    // Simulate some initial messages
    this.simulatedMessages = [
      {
        topic: "cm4/sensors/temperature",
        payload: JSON.stringify({ value: 22.5, unit: "C" }),
        qos: 1,
        retain: false,
        timestamp: Date.now(),
      },
      {
        topic: "cm4/sensors/humidity",
        payload: JSON.stringify({ value: 45.2, unit: "%" }),
        qos: 1,
        retain: false,
        timestamp: Date.now(),
      },
      {
        topic: "cm4/sensors/pressure",
        payload: JSON.stringify({ value: 1013.2, unit: "hPa" }),
        qos: 1,
        retain: false,
        timestamp: Date.now(),
      },
    ]
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate connection delay
      setTimeout(() => {
        this.connected = true
        this.notifyConnectionListeners()

        // Start simulating incoming messages
        this.startSimulation()

        resolve()
      }, 1000)
    })
  }

  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.interval) {
        clearInterval(this.interval)
        this.interval = null
      }

      // Simulate disconnection delay
      setTimeout(() => {
        this.connected = false
        this.notifyConnectionListeners()
        resolve()
      }, 500)
    })
  }

  isConnected(): boolean {
    return this.connected
  }

  subscribe(topic: string): Promise<void> {
    return new Promise((resolve) => {
      // Simulate subscription delay
      setTimeout(() => {
        console.log(`Subscribed to ${topic}`)
        resolve()
      }, 300)
    })
  }

  unsubscribe(topic: string): Promise<void> {
    return new Promise((resolve) => {
      // Simulate unsubscription delay
      setTimeout(() => {
        console.log(`Unsubscribed from ${topic}`)
        resolve()
      }, 300)
    })
  }

  publish(topic: string, payload: string, qos = 0, retain = false): Promise<void> {
    return new Promise((resolve) => {
      // Simulate publish delay
      setTimeout(() => {
        console.log(`Published to ${topic}: ${payload}`)
        resolve()
      }, 200)
    })
  }

  onMessage(callback: (message: MQTTMessage) => void): void {
    this.messageListeners.push(callback)
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionListeners.push(callback)
    // Immediately notify with current state
    callback(this.connected)
  }

  private notifyMessageListeners(message: MQTTMessage): void {
    this.messageListeners.forEach((listener) => listener(message))
  }

  private notifyConnectionListeners(): void {
    this.connectionListeners.forEach((listener) => listener(this.connected))
  }

  private startSimulation(): void {
    this.interval = setInterval(() => {
      if (!this.connected) return

      // Randomly select a sensor to update
      const topics = ["cm4/sensors/temperature", "cm4/sensors/humidity", "cm4/sensors/pressure"]
      const randomTopic = topics[Math.floor(Math.random() * topics.length)]

      let value: number
      let unit: string

      switch (randomTopic) {
        case "cm4/sensors/temperature":
          value = 20 + Math.random() * 5
          unit = "C"
          break
        case "cm4/sensors/humidity":
          value = 40 + Math.random() * 20
          unit = "%"
          break
        case "cm4/sensors/pressure":
          value = 1000 + Math.random() * 15
          unit = "hPa"
          break
        default:
          value = 0
          unit = ""
      }

      const message: MQTTMessage = {
        topic: randomTopic,
        payload: JSON.stringify({ value: Math.round(value * 10) / 10, unit }),
        qos: 1,
        retain: false,
        timestamp: Date.now(),
      }

      this.notifyMessageListeners(message)
    }, 5000) // Send a message every 5 seconds
  }
}

// Create a singleton instance
let mqttClient: MQTTClient | null = null

export function getMQTTClient(): MQTTClient {
  if (!mqttClient) {
    mqttClient = new MQTTClient({
      clientId: `cm4-client-${Math.random().toString(16).substring(2, 10)}`,
      host: "mqtt.example.com",
      port: 8883,
      ssl: true,
    })
  }
  return mqttClient
}
