"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Wifi, Bluetooth, NetworkIcon, Cpu, Radio, Gauge } from "lucide-react"

export function ProtocolSettings() {
  const [activeTab, setActiveTab] = useState("wifi")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication Protocols</CardTitle>
        <CardDescription>Configure protocol settings for device communication</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wifi" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:grid-cols-8">
            <TabsTrigger value="wifi" className="flex flex-col items-center py-2">
              <Wifi className="h-4 w-4 mb-1" />
              <span className="text-xs">Wi-Fi</span>
            </TabsTrigger>
            <TabsTrigger value="bluetooth" className="flex flex-col items-center py-2">
              <Bluetooth className="h-4 w-4 mb-1" />
              <span className="text-xs">BLE</span>
            </TabsTrigger>
            <TabsTrigger value="ethernet" className="flex flex-col items-center py-2">
              <NetworkIcon className="h-4 w-4 mb-1" />
              <span className="text-xs">Ethernet</span>
            </TabsTrigger>
            <TabsTrigger value="i2c" className="flex flex-col items-center py-2">
              <Cpu className="h-4 w-4 mb-1" />
              <span className="text-xs">I²C</span>
            </TabsTrigger>
            <TabsTrigger value="spi" className="flex flex-col items-center py-2">
              <Cpu className="h-4 w-4 mb-1" />
              <span className="text-xs">SPI</span>
            </TabsTrigger>
            <TabsTrigger value="can" className="flex flex-col items-center py-2">
              <Cpu className="h-4 w-4 mb-1" />
              <span className="text-xs">CAN</span>
            </TabsTrigger>
            <TabsTrigger value="modbus" className="flex flex-col items-center py-2">
              <Gauge className="h-4 w-4 mb-1" />
              <span className="text-xs">MODBUS</span>
            </TabsTrigger>
            <TabsTrigger value="mqtt" className="flex flex-col items-center py-2">
              <Radio className="h-4 w-4 mb-1" />
              <span className="text-xs">MQTT</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="wifi" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wifi-ssid">SSID</Label>
                  <Input id="wifi-ssid" defaultValue="CM4_Network" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi-password">Password</Label>
                  <Input id="wifi-password" type="password" defaultValue="********" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wifi-mode">Mode</Label>
                  <Select defaultValue="station">
                    <SelectTrigger id="wifi-mode">
                      <SelectValue placeholder="Select Wi-Fi mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="station">Station (Client)</SelectItem>
                      <SelectItem value="ap">Access Point</SelectItem>
                      <SelectItem value="ap-sta">AP + Station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi-channel">Channel</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger id="wifi-channel">
                      <SelectValue placeholder="Select Wi-Fi channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="1">Channel 1</SelectItem>
                      <SelectItem value="6">Channel 6</SelectItem>
                      <SelectItem value="11">Channel 11</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wifi-ip">IP Address</Label>
                  <Input id="wifi-ip" defaultValue="192.168.1.105" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi-subnet">Subnet Mask</Label>
                  <Input id="wifi-subnet" defaultValue="255.255.255.0" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="wifi-dhcp" defaultChecked />
                <Label htmlFor="wifi-dhcp">Enable DHCP</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="wifi-autoconnect" defaultChecked />
                <Label htmlFor="wifi-autoconnect">Auto-connect on startup</Label>
              </div>
            </TabsContent>

            <TabsContent value="i2c" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="i2c-bus">Bus</Label>
                  <Select defaultValue="1">
                    <SelectTrigger id="i2c-bus">
                      <SelectValue placeholder="Select I2C bus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Bus 0</SelectItem>
                      <SelectItem value="1">Bus 1</SelectItem>
                      <SelectItem value="2">Bus 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="i2c-speed">Speed</Label>
                  <Select defaultValue="400000">
                    <SelectTrigger id="i2c-speed">
                      <SelectValue placeholder="Select I2C speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100000">100 kHz (Standard)</SelectItem>
                      <SelectItem value="400000">400 kHz (Fast)</SelectItem>
                      <SelectItem value="1000000">1 MHz (Fast Plus)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Detected Devices</Label>
                <div className="border rounded-md p-3 text-sm">
                  <div className="grid grid-cols-3 font-medium pb-2 border-b">
                    <div>Address</div>
                    <div>Device</div>
                    <div>Status</div>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b">
                    <div>0x76</div>
                    <div>BME280</div>
                    <div className="text-green-500">Active</div>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b">
                    <div>0x68</div>
                    <div>DS3231</div>
                    <div className="text-green-500">Active</div>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b">
                    <div>0x40</div>
                    <div>INA219</div>
                    <div className="text-green-500">Active</div>
                  </div>
                  <div className="grid grid-cols-3 py-2">
                    <div>0x48</div>
                    <div>ADS1115</div>
                    <div className="text-green-500">Active</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="i2c-enable" defaultChecked />
                <Label htmlFor="i2c-enable">Enable I2C</Label>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="mr-2">
                  Scan Bus
                </Button>
                <Button size="sm">Apply Settings</Button>
              </div>
            </TabsContent>

            <TabsContent value="can" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="can-interface">Interface</Label>
                  <Select defaultValue="can0">
                    <SelectTrigger id="can-interface">
                      <SelectValue placeholder="Select CAN interface" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="can0">can0</SelectItem>
                      <SelectItem value="can1">can1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="can-bitrate">Bitrate</Label>
                  <Select defaultValue="500000">
                    <SelectTrigger id="can-bitrate">
                      <SelectValue placeholder="Select CAN bitrate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="125000">125 kbit/s</SelectItem>
                      <SelectItem value="250000">250 kbit/s</SelectItem>
                      <SelectItem value="500000">500 kbit/s</SelectItem>
                      <SelectItem value="1000000">1 Mbit/s</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="can-mode">Mode</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger id="can-mode">
                      <SelectValue placeholder="Select CAN mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="loopback">Loopback</SelectItem>
                      <SelectItem value="listen-only">Listen Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="can-restart">Restart Mode</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger id="can-restart">
                      <SelectValue placeholder="Select restart mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Statistics</Label>
                <div className="border rounded-md p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>RX Frames:</div>
                    <div>0</div>
                    <div>TX Frames:</div>
                    <div>0</div>
                    <div>RX Errors:</div>
                    <div>0</div>
                    <div>TX Errors:</div>
                    <div>0</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="can-enable" />
                <Label htmlFor="can-enable">Enable CAN</Label>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="mr-2">
                  Reset Statistics
                </Button>
                <Button size="sm">Apply Settings</Button>
              </div>
            </TabsContent>

            {/* Other protocol tabs would go here */}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
