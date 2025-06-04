"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Server, Activity, Globe, Cpu } from "lucide-react"

export function ServiceMonitor() {
  const services = [
    { name: "MongoDB", status: "Running", icon: Database, color: "text-green-500", badge: "green" },
    { name: "InfluxDB", status: "Running", icon: Database, color: "text-green-500", badge: "green" },
    { name: "Grafana", status: "Running", icon: Activity, color: "text-green-500", badge: "green" },
    { name: "Nginx", status: "Running", icon: Globe, color: "text-green-500", badge: "green" },
    { name: "Webmin", status: "Running", icon: Server, color: "text-green-500", badge: "green" },
    { name: "SPI", status: "Active", icon: Cpu, color: "text-green-500", badge: "green" },
    { name: "I2C", status: "Active", icon: Cpu, color: "text-green-500", badge: "green" },
    { name: "CAN0", status: "Inactive", icon: Cpu, color: "text-red-500", badge: "red" },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>System Services</CardTitle>
        <CardDescription>Status of running services and interfaces</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <service.icon className={`h-4 w-4 ${service.color}`} />
                <span className="text-sm font-medium">{service.name}</span>
              </div>
              <Badge
                variant={service.badge === "green" ? "default" : "destructive"}
                className={service.badge === "green" ? "bg-green-500" : ""}
              >
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
