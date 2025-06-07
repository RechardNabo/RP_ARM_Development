// Grafana integration service for the CM4-IO-WIRELESS-BASE
import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios"

export interface GrafanaConfig {
  url: string
  apiKey?: string
  username?: string
  password?: string
}

export interface Dashboard {
  id?: number
  uid?: string
  title: string
  tags?: string[]
  timezone?: string
  panels: any[]
  time?: {
    from: string
    to: string
  }
}

export class GrafanaService {
  private static instance: GrafanaService
  private client: AxiosInstance
  private config: GrafanaConfig

  private constructor(config: GrafanaConfig) {
    this.config = config

    const axiosConfig: AxiosRequestConfig = {
      baseURL: config.url,
      headers: {},
    }

    if (config.apiKey) {
      axiosConfig.headers!["Authorization"] = `Bearer ${config.apiKey}`
    } else if (config.username && config.password) {
      axiosConfig.auth = {
        username: config.username,
        password: config.password,
      }
    }

    this.client = axios.create(axiosConfig)
  }

  public static getInstance(config?: GrafanaConfig): GrafanaService {
    if (!GrafanaService.instance) {
      if (!config) {
        // Default configuration for local Grafana on Raspberry Pi
        config = {
          url: "http://localhost:3000",
          username: "admin",
          password: "admin",
        }
      }
      GrafanaService.instance = new GrafanaService(config)
    }
    return GrafanaService.instance
  }

  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/api/health")
      return response.data.database === "ok"
    } catch (error) {
      console.error("Failed to connect to Grafana:", error)
      return false
    }
  }

  public async getDashboards(): Promise<Dashboard[]> {
    try {
      const response = await this.client.get("/api/search?type=dash-db")
      return response.data
    } catch (error) {
      console.error("Failed to get dashboards:", error)
      return []
    }
  }

  public async getDashboard(uid: string): Promise<Dashboard | null> {
    try {
      const response = await this.client.get(`/api/dashboards/uid/${uid}`)
      return response.data.dashboard
    } catch (error) {
      console.error(`Failed to get dashboard with UID ${uid}:`, error)
      return null
    }
  }

  public async createDashboard(dashboard: Dashboard): Promise<string | null> {
    try {
      const payload = {
        dashboard,
        overwrite: true,
      }

      const response = await this.client.post("/api/dashboards/db", payload)
      return response.data.uid
    } catch (error) {
      console.error("Failed to create dashboard:", error)
      return null
    }
  }

  public async deleteDashboard(uid: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/dashboards/uid/${uid}`)
      return true
    } catch (error) {
      console.error(`Failed to delete dashboard with UID ${uid}:`, error)
      return false
    }
  }

  public async createSensorDashboard(title: string, deviceId: string, sensorTypes: string[]): Promise<string | null> {
    try {
      // Create a simple dashboard with panels for each sensor type
      const panels: any[] = []

      sensorTypes.forEach((sensorType, index) => {
        panels.push({
          id: index + 1,
          gridPos: {
            h: 8,
            w: 12,
            x: (index % 2) * 12,
            y: Math.floor(index / 2) * 8,
          },
          type: "graph",
          title: `${sensorType} Data`,
          datasource: "InfluxDB",
          targets: [
            {
              query: `
from(bucket: "cm4_iot_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> filter(fn: (r) => r.deviceId == "${deviceId}")
  |> filter(fn: (r) => r.sensorType == "${sensorType}")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> yield(name: "mean")
              `,
              refId: "A",
            },
          ],
        })
      })

      const dashboard: Dashboard = {
        title,
        tags: ["cm4", "iot", "sensors", deviceId],
        timezone: "browser",
        panels,
        time: {
          from: "now-6h",
          to: "now",
        },
      }

      return this.createDashboard(dashboard)
    } catch (error) {
      console.error("Failed to create sensor dashboard:", error)
      return null
    }
  }

  public getDashboardUrl(uid: string): string {
    return `${this.config.url}/d/${uid}`
  }
}

// Create a singleton instance
let grafanaService: GrafanaService | null = null

export function getGrafanaService(config?: GrafanaConfig): GrafanaService {
  if (!grafanaService) {
    grafanaService = GrafanaService.getInstance(config)
  }
  return grafanaService
}
