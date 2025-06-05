"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState, useEffect } from "react"

const generateData = () => {
  const now = new Date()
  return Array.from({ length: 10 }, (_, i) => {
    const time = new Date(now.getTime() - (9 - i) * 60000)
    return {
      time: `${time.getHours()}:${time.getMinutes().toString().padStart(2, "0")}`,
      temperature: Math.round((20 + Math.random() * 5) * 10) / 10,
      humidity: Math.round((40 + Math.random() * 20) * 10) / 10,
      pressure: Math.round((1000 + Math.random() * 15) * 10) / 10,
    }
  })
}

export function SensorReadings() {
  const [data, setData] = useState(generateData)

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const now = new Date()
        const newTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`
        const newData = [
          ...prevData.slice(1),
          {
            time: newTime,
            temperature: Math.round((20 + Math.random() * 5) * 10) / 10,
            humidity: Math.round((40 + Math.random() * 20) * 10) / 10,
            pressure: Math.round((1000 + Math.random() * 15) * 10) / 10,
          },
        ]
        return newData
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sensor Readings</CardTitle>
        <CardDescription>Real-time environmental data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature (°C)" />
              <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidity (%)" />
              <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="#10b981" name="Pressure (hPa)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
