import { useState, useEffect } from 'react'

export interface SystemMetrics {
  cpu: {
    usage: number
    temperature: number
  }
  memory: {
    total: number
    used: number
    free: number
  }
  storage: {
    total: number
    used: number
    free: number
  }
  temperature: number
  uptime: {
    days: number
    hours: number
    minutes: number
  }
  services: Array<{
    name: string
    status: 'active' | 'inactive' | 'failed' | 'activating' | 'unknown'
    description: string
  }>
}

export function useSystemMetrics() {
  const [data, setData] = useState<SystemMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/system/metrics')
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`)
      }
      const data = await response.json()
      setData(data)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching system metrics:', err)
      setError(err)
    } finally {
      setIsLoading(false)
      setLastUpdated(new Date())
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchMetrics()
    
    // Fetch metrics every 10 seconds
    const interval = setInterval(fetchMetrics, 10000)
    
    return () => {
      clearInterval(interval)
    }
  }, [])

  // Function to manually refresh the data
  const refresh = () => {
    fetchMetrics()
  }

  return { data, isLoading, error, lastUpdated, refresh }
}
