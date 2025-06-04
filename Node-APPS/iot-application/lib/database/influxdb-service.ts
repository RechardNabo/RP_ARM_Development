// InfluxDB connection service for the CM4-IO-WIRELESS-BASE
import { InfluxDB, Point, type WriteApi, type QueryApi } from "@influxdata/influxdb-client"

export interface InfluxDBConfig {
  url: string
  token: string
  org: string
  bucket: string
}

export class InfluxDBService {
  private static instance: InfluxDBService
  private client: InfluxDB | null = null
  private writeApi: WriteApi | null = null
  private queryApi: QueryApi | null = null
  private config: InfluxDBConfig
  private isConnected = false

  private constructor(config: InfluxDBConfig) {
    this.config = config
  }

  public static getInstance(config?: InfluxDBConfig): InfluxDBService {
    if (!InfluxDBService.instance) {
      if (!config) {
        // Default configuration for local InfluxDB on Raspberry Pi
        config = {
          url: "http://localhost:8086",
          token: "", // In a real setup, this would be a valid token
          org: "cm4_org",
          bucket: "cm4_iot_data",
        }
      }
      InfluxDBService.instance = new InfluxDBService(config)
    }
    return InfluxDBService.instance
  }

  public connect(): boolean {
    try {
      if (this.isConnected) {
        console.log("Already connected to InfluxDB")
        return true
      }

      const { url, token, org, bucket } = this.config

      this.client = new InfluxDB({ url, token })
      this.writeApi = this.client.getWriteApi(org, bucket, "ns")
      this.queryApi = this.client.getQueryApi(org)

      this.isConnected = true
      console.log(`Connected to InfluxDB at ${url}`)
      return true
    } catch (error) {
      console.error("Failed to connect to InfluxDB:", error)
      return false
    }
  }

  public async disconnect(): Promise<void> {
    if (this.writeApi && this.isConnected) {
      try {
        await this.writeApi.close()
        this.isConnected = false
        console.log("Disconnected from InfluxDB")
      } catch (error) {
        console.error("Error disconnecting from InfluxDB:", error)
      }
    }
  }

  public async writePoint(
    measurement: string,
    tags: Record<string, string>,
    fields: Record<string, number | string | boolean>,
  ): Promise<boolean> {
    if (!this.writeApi || !this.isConnected) {
      console.error("Not connected to InfluxDB")
      return false
    }

    try {
      const point = new Point(measurement)

      // Add tags
      Object.entries(tags).forEach(([key, value]) => {
        point.tag(key, value)
      })

      // Add fields
      Object.entries(fields).forEach(([key, value]) => {
        if (typeof value === "number") {
          point.floatField(key, value)
        } else if (typeof value === "string") {
          point.stringField(key, value)
        } else if (typeof value === "boolean") {
          point.booleanField(key, value)
        }
      })

      this.writeApi.writePoint(point)
      await this.writeApi.flush()
      return true
    } catch (error) {
      console.error("Error writing point to InfluxDB:", error)
      return false
    }
  }

  public async writeSensorData(deviceId: string, sensorType: string, value: number, unit: string): Promise<boolean> {
    return this.writePoint("sensor_data", { deviceId, sensorType }, { value, unit, timestamp: Date.now() })
  }

  public async query(fluxQuery: string): Promise<any[]> {
    if (!this.queryApi || !this.isConnected) {
      console.error("Not connected to InfluxDB")
      return []
    }

    try {
      const result: any[] = []

      await new Promise<void>((resolve, reject) => {
        this.queryApi!.queryRows(fluxQuery, {
          next: (row, tableMeta) => {
            const tableObject = tableMeta.toObject(row)
            result.push(tableObject)
          },
          error: (error) => {
            console.error("Error executing InfluxDB query:", error)
            reject(error)
          },
          complete: () => {
            resolve()
          },
        })
      })

      return result
    } catch (error) {
      console.error("Error querying InfluxDB:", error)
      return []
    }
  }

  public async getSensorData(deviceId: string, sensorType: string, timeRange = "-1h"): Promise<any[]> {
    const query = `
      from(bucket: "${this.config.bucket}")
        |> range(start: ${timeRange})
        |> filter(fn: (r) => r._measurement == "sensor_data")
        |> filter(fn: (r) => r.deviceId == "${deviceId}")
        |> filter(fn: (r) => r.sensorType == "${sensorType}")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    `

    return this.query(query)
  }

  public isConnectedToDatabase(): boolean {
    return this.isConnected
  }
}

// Create a singleton instance
let influxDBService: InfluxDBService | null = null

export function getInfluxDBService(config?: InfluxDBConfig): InfluxDBService {
  if (!influxDBService) {
    influxDBService = InfluxDBService.getInstance(config)
  }
  return influxDBService
}
