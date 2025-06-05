"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Clock, ZoomIn, ZoomOut, Save, Share2 } from "lucide-react"

// Generate sample data for charts
const generateTimeSeriesData = (hours = 24, interval = 1) => {
  const now = new Date()
  return Array.from({ length: hours / interval }, (_, i) => {
    const time = new Date(now.getTime() - (hours - i * interval) * 60 * 60 * 1000)
    const formattedTime = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`
    return {
      time: formattedTime,
      temperature: Math.round((22 + Math.sin(i / 3) * 5 + Math.random() * 2) * 10) / 10,
      humidity: Math.round((50 + Math.cos(i / 3) * 15 + Math.random() * 5) * 10) / 10,
      pressure: Math.round((1010 + Math.sin(i / 6) * 10 + Math.random() * 3) * 10) / 10,
      voltage: Math.round((3.3 + Math.sin(i / 4) * 0.2 + Math.random() * 0.1) * 100) / 100,
      current: Math.round((0.5 + Math.cos(i / 5) * 0.3 + Math.random() * 0.1) * 100) / 100,
    }
  })
}

const lineData = generateTimeSeriesData(24, 1)
const streamingData = generateTimeSeriesData(6, 0.25)
const areaData = generateTimeSeriesData(24, 1)

export function LiveDataCharts() {
  const [chartType, setChartType] = useState("line")
  const [timeRange, setTimeRange] = useState("24h")

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <CardTitle>Real-Time Sensor Data</CardTitle>
            <CardDescription>Live monitoring of connected sensors</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="24h" onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center">
              <Button variant="ghost" size="icon">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon">
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line" onValueChange={setChartType}>
          <TabsList className="mb-4">
            <TabsTrigger value="line">Line Chart</TabsTrigger>
            <TabsTrigger value="area">Area Chart</TabsTrigger>
            <TabsTrigger value="streaming">Streaming Chart</TabsTrigger>
            <TabsTrigger value="multi">Multi-Line</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="line" className="h-[400px]">
            <ChartContainer
              config={{
                temperature: {
                  label: "Temperature (°C)",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent indicator="line" />} />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="var(--color-temperature)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="area" className="h-[400px]">
            <ChartContainer
              config={{
                humidity: {
                  label: "Humidity (%)",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent indicator="line" />} />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    stroke="var(--color-humidity)"
                    fill="var(--color-humidity)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="streaming" className="h-[400px]">
            <ChartContainer
              config={{
                voltage: {
                  label: "Voltage (V)",
                  color: "hsl(var(--chart-3))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={streamingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis domain={[2.8, 3.8]} />
                  <Tooltip content={<ChartTooltipContent indicator="line" />} />
                  <Line
                    type="monotone"
                    dataKey="voltage"
                    stroke="var(--color-voltage)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="multi" className="h-[400px]">
            <ChartContainer
              config={{
                temperature: {
                  label: "Temperature (°C)",
                  color: "hsl(var(--chart-1))",
                },
                humidity: {
                  label: "Humidity (%)",
                  color: "hsl(var(--chart-2))",
                },
                pressure: {
                  label: "Pressure (hPa)",
                  color: "hsl(var(--chart-3))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<ChartTooltipContent indicator="line" />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    stroke="var(--color-temperature)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="humidity"
                    stroke="var(--color-humidity)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="pressure"
                    stroke="var(--color-pressure)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="bar" className="h-[400px]">
            <ChartContainer
              config={{
                temperature: {
                  label: "Temperature (°C)",
                  color: "hsl(var(--chart-1))",
                },
                humidity: {
                  label: "Humidity (%)",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lineData.filter((_, i) => i % 4 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent indicator="bar" />} />
                  <Bar dataKey="temperature" fill="var(--color-temperature)" radius={4} />
                  <Bar dataKey="humidity" fill="var(--color-humidity)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
