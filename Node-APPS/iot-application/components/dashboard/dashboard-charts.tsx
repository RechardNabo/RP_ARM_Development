"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const generateData = (count = 24) => {
  return Array.from({ length: count }, (_, i) => {
    const hour = i % 24
    const time = `${hour.toString().padStart(2, "0")}:00`
    return {
      time,
      temperature: Math.round((20 + Math.sin(i / 3) * 5 + Math.random() * 2) * 10) / 10,
      humidity: Math.round((50 + Math.cos(i / 3) * 15 + Math.random() * 5) * 10) / 10,
      pressure: Math.round((1010 + Math.sin(i / 6) * 10 + Math.random() * 3) * 10) / 10,
      cpu: Math.round((15 + Math.sin(i / 2) * 10 + Math.random() * 5) * 10) / 10,
      memory: Math.round((30 + Math.cos(i / 4) * 15 + Math.random() * 10) * 10) / 10,
    }
  })
}

const lineData = generateData()
const areaData = generateData()
const barData = generateData(7).map((item, i) => ({
  ...item,
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
}))

export function DashboardCharts() {
  const [chartType, setChartType] = useState("line")

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>System Metrics</CardTitle>
        <CardDescription>Performance metrics over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line" onValueChange={setChartType}>
          <TabsList className="mb-4">
            <TabsTrigger value="line">Line Chart</TabsTrigger>
            <TabsTrigger value="area">Area Chart</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="multi">Multi-Line</TabsTrigger>
          </TabsList>

          <TabsContent value="line" className="h-[300px]">
            <ChartContainer
              config={{
                temperature: {
                  label: "Temperature",
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

          <TabsContent value="area" className="h-[300px]">
            <ChartContainer
              config={{
                humidity: {
                  label: "Humidity",
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

          <TabsContent value="bar" className="h-[300px]">
            <ChartContainer
              config={{
                cpu: {
                  label: "CPU Usage",
                  color: "hsl(var(--chart-3))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent indicator="line" />} />
                  <Bar dataKey="cpu" fill="var(--color-cpu)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="multi" className="h-[300px]">
            <ChartContainer
              config={{
                temperature: {
                  label: "Temperature",
                  color: "hsl(var(--chart-1))",
                },
                humidity: {
                  label: "Humidity",
                  color: "hsl(var(--chart-2))",
                },
                pressure: {
                  label: "Pressure",
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
        </Tabs>
      </CardContent>
    </Card>
  )
}
