import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wifi, Bluetooth, NetworkIcon as Ethernet, Radio, Globe } from "lucide-react"

export function ProtocolSelector() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication Protocols</CardTitle>
        <CardDescription>Select and configure communication methods</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wifi">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="wifi" className="flex flex-col items-center py-2">
              <Wifi className="h-4 w-4 mb-1" />
              <span className="text-xs">Wi-Fi</span>
            </TabsTrigger>
            <TabsTrigger value="bluetooth" className="flex flex-col items-center py-2">
              <Bluetooth className="h-4 w-4 mb-1" />
              <span className="text-xs">BLE</span>
            </TabsTrigger>
            <TabsTrigger value="ethernet" className="flex flex-col items-center py-2">
              <Ethernet className="h-4 w-4 mb-1" />
              <span className="text-xs">Ethernet</span>
            </TabsTrigger>
            <TabsTrigger value="mqtt" className="flex flex-col items-center py-2">
              <Radio className="h-4 w-4 mb-1" />
              <span className="text-xs">MQTT</span>
            </TabsTrigger>
            <TabsTrigger value="http" className="flex flex-col items-center py-2">
              <Globe className="h-4 w-4 mb-1" />
              <span className="text-xs">HTTP</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wifi" className="mt-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">SSID:</span>
                <span className="text-sm col-span-2">CM4_Network</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Security:</span>
                <span className="text-sm col-span-2">WPA2-PSK</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">IP Address:</span>
                <span className="text-sm col-span-2">192.168.1.105</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Signal Strength:</span>
                <span className="text-sm col-span-2">-58 dBm (Excellent)</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bluetooth" className="mt-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Device Name:</span>
                <span className="text-sm col-span-2">CM4-IoT-Device</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">MAC Address:</span>
                <span className="text-sm col-span-2">E4:5F:01:2D:3A:BC</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Connected Devices:</span>
                <span className="text-sm col-span-2">2 devices</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Mode:</span>
                <span className="text-sm col-span-2">BLE Central & Peripheral</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ethernet" className="mt-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">IP Address:</span>
                <span className="text-sm col-span-2">192.168.1.100</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Subnet Mask:</span>
                <span className="text-sm col-span-2">255.255.255.0</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Gateway:</span>
                <span className="text-sm col-span-2">192.168.1.1</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Speed:</span>
                <span className="text-sm col-span-2">1 Gbps (Full Duplex)</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mqtt" className="mt-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Broker:</span>
                <span className="text-sm col-span-2">mqtt.example.com</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Port:</span>
                <span className="text-sm col-span-2">1883 (8883 for TLS)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Topics:</span>
                <span className="text-sm col-span-2">cm4/sensors/+, cm4/control/#</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">QoS:</span>
                <span className="text-sm col-span-2">1 (At least once)</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="http" className="mt-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">API Endpoint:</span>
                <span className="text-sm col-span-2">https://api.example.com/v1</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Authentication:</span>
                <span className="text-sm col-span-2">Bearer Token</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Local Server:</span>
                <span className="text-sm col-span-2">http://192.168.1.100:3000</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">Webhook:</span>
                <span className="text-sm col-span-2">Enabled (Events: sensor, alert)</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
