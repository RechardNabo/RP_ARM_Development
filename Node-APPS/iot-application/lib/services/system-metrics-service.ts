import { type SystemMetrics } from "@/app/api/system/metrics/route"

export class SystemMetricsService {
  private static instance: SystemMetricsService
  private metrics: SystemMetrics | null = null
  // Using a generic type instead of NodeJS namespace
  private refreshInterval: any = null
  private refreshRate: number = 500 // 500ms default refresh rate
  private listeners: Array<(metrics: SystemMetrics) => void> = []

  private constructor() {
    // Initialize with default values
    this.metrics = {
      cpu: { usage: 0 },
      memory: { total: 0, used: 0, free: 0 },
      storage: { total: 0, used: 0, free: 0 },
      temperature: { cpu: 0 },
      uptime: { days: 0, hours: 0, minutes: 0 },
      services: []
    }
  }

  public static getInstance(): SystemMetricsService {
    if (!SystemMetricsService.instance) {
      SystemMetricsService.instance = new SystemMetricsService()
    }
    return SystemMetricsService.instance
  }

  /**
   * Start fetching metrics at the specified refresh rate
   * @param refreshRate Optional refresh rate in milliseconds (default: 500ms)
   */
  public startMetricsPolling(refreshRate: number = 500): void {
    this.stopMetricsPolling() // Stop any existing polling
    
    this.refreshRate = refreshRate
    console.log(`Starting system metrics polling with refresh rate: ${refreshRate}ms`)
    
    // Fetch immediately once
    this.fetchMetrics()
    
    // Then set up interval
    this.refreshInterval = setInterval(() => {
      this.fetchMetrics()
    }, this.refreshRate)
  }

  /**
   * Stop fetching metrics
   */
  public stopMetricsPolling(): void {
    if (this.refreshInterval) {
      console.log('Stopping system metrics polling')
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  /**
   * Fetch metrics from the API
   */
  private async fetchMetrics(): Promise<void> {
    try {
      const response = await fetch('/api/system/metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // No caching - we want fresh data every time
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Error fetching metrics: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.metrics) {
        this.metrics = data.metrics
        
        // Notify all listeners
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error)
    }
  }

  /**
   * Get the current metrics
   * @returns The current system metrics
   */
  public getMetrics(): SystemMetrics | null {
    return this.metrics
  }

  /**
   * Add a listener for metrics updates
   * @param listener Function to call when metrics are updated
   */
  public addListener(listener: (metrics: SystemMetrics) => void): void {
    this.listeners.push(listener)
  }

  /**
   * Remove a listener
   * @param listener The listener to remove
   */
  public removeListener(listener: (metrics: SystemMetrics) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  /**
   * Notify all listeners of updated metrics
   */
  private notifyListeners(): void {
    if (this.metrics) {
      this.listeners.forEach(listener => {
        try {
          listener(this.metrics!)
        } catch (error) {
          console.error('Error in metrics listener:', error)
        }
      })
    }
  }

  /**
   * Get the current refresh rate
   * @returns Current refresh rate in milliseconds
   */
  public getRefreshRate(): number {
    return this.refreshRate
  }
}

/**
 * Get the singleton instance of SystemMetricsService
 */
export function getSystemMetricsService(): SystemMetricsService {
  return SystemMetricsService.getInstance()
}
