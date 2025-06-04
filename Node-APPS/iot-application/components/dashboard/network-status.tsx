"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wifi, NetworkIcon, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function NetworkStatus() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Network Status</CardTitle>
        <CardDescription>Current network connections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Wi-Fi</span>
            </div>
            <Badge className="bg-green-500">Connected</Badge>
          </div>
          <div className="pl-6 text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>SSID:</span>
              <span>CM4_Network</span>
            </div>
            <div className="flex justify-between">
              <span>IP:</span>
              <span>192.168.1.105</span>
            </div>
            <div className="flex justify-between">
              <span>Signal:</span>
              <span>-58 dBm</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <NetworkIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Ethernet</span>
            </div>
            <Badge className="bg-green-500">Connected</Badge>
          </div>
          <div className="pl-6 text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>IP:</span>
              <span>192.168.1.100</span>
            </div>
            <div className="flex justify-between">
              <span>Speed:</span>
              <span>1 Gbps</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Internet</span>
            </div>
            <Badge className="bg-green-500">Connected</Badge>
          </div>
          <div className="pl-6 text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span>Online</span>
            </div>
            <div className="flex justify-between">
              <span>Ping:</span>
              <span>24 ms</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
