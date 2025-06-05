"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDeviceStore } from "@/lib/device-store"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

// Helper function to generate random data points
const generateDataPoints = (count: number, baseValue: number, variance: number) => {
  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date()
    timestamp.setHours(timestamp.getHours() - (count - i - 1))

    return {
      time: timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: Math.max(0, baseValue + Math.random() * variance * 2 - variance),
    }
  })
}

export function DeviceHealthMetrics() {
  const { devices } = useDeviceStore()
  const [activeTab, setActiveTab] = useState("performance")
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [batteryData, setBatteryData] = useState<any[]>([])
  const [temperatureData, setTemperatureData] = useState<any[]>([])
  const [connectivityData, setConnectivityData] = useState<any[]>([])

  useEffect(() => {
    // Generate sample data for each metric
    const dataPoints = 24 // 24 hours of data

    // Performance data (CPU, Memory)
    const cpuData = generateDataPoints(dataPoints, 50, 20)
    const memoryData = generateDataPoints(dataPoints, 60, 15)

    const perfData = cpuData.map((point, i) => ({
      time: point.time,
      cpu: point.value,
      memory: memoryData[i].value,
    }))
    setPerformanceData(perfData)

    // Battery data for devices with batteries
    const devicesWithBattery = devices.filter((d) => d.battery && d.battery !== "N/A").slice(0, 3)
    const battData = cpuData.map((point, i) => {
      const result: any = { time: point.time }

      devicesWithBattery.forEach((device, idx) => {
        const baseValue = Number.parseInt(device.battery?.replace("%", "") || "0")
        const variance = 5
        result[device.name] = Math.max(
          0,
          Math.min(100, baseValue - idx * 0.2 - i * 0.1 + Math.random() * variance * 2 - variance),
        )
      })

      return result
    })
    setBatteryData(battData)

    // Temperature data
    const tempData = cpuData.map((point, i) => ({
      time: point.time,
      ambient: 22 + Math.random() * 3 - 1.5,
      device: 35 + Math.random() * 10 - 5,
    }))
    setTemperatureData(tempData)

    // Connectivity data (signal strength, latency)
    const connData = cpuData.map((point, i) => ({
      time: point.time,
      signal: 75 + Math.random() * 20 - 10,
      latency: 50 + Math.random() * 100 - 50,
    }))
    setConnectivityData(connData)
  }, [devices])

  return (
    <Tabs defaultValue="performance" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="battery">Battery</TabsTrigger>
        <TabsTrigger value="temperature">Temperature</TabsTrigger>
        <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
      </TabsList>

      <TabsContent value="performance" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis unit="%" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cpu" name="CPU Usage" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="memory" name="Memory Usage" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>

      <TabsContent value="battery" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={batteryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis unit="%" />
            <Tooltip />
            <Legend />
            {devices
              .filter((d) => d.battery && d.battery !== "N/A")
              .slice(0, 3)
              .map((device, idx) => (
                <Line
                  key={device.id}
                  type="monotone"
                  dataKey={device.name}
                  name={device.name}
                  stroke={idx === 0 ? "#8884d8" : idx === 1 ? "#82ca9d" : "#ffc658"}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>

      <TabsContent value="temperature" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={temperatureData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis unit="°C" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ambient" name="Ambient Temperature" stroke="#8884d8" />
            <Line type="monotone" dataKey="device" name="Device Temperature" stroke="#ff7300" />
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>

      <TabsContent value="connectivity" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={connectivityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" unit="%" />
            <YAxis yAxisId="right" orientation="right" unit="ms" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="signal" name="Signal Strength" stroke="#8884d8" />
            <Line yAxisId="right" type="monotone" dataKey="latency" name="Latency" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>
    </Tabs>
  )
}
