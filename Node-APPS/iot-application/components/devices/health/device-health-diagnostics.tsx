"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  Search,
  Wifi,
  Zap,
  Battery,
} from "lucide-react"
import { useDeviceStore } from "@/lib/device-store"

export function DeviceHealthDiagnostics() {
  const { devices } = useDeviceStore()
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("diagnostics")
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])

  const handleRunDiagnostics = () => {
    if (!selectedDevice) return

    setIsRunningTest(true)
    setTestResults([])

    // Simulate running diagnostics with sequential updates
    const tests = [
      { name: "Connectivity Test", status: "running" },
      { name: "Battery Health Check", status: "pending" },
      { name: "Sensor Calibration Test", status: "pending" },
      { name: "Memory Diagnostic", status: "pending" },
      { name: "Firmware Validation", status: "pending" },
    ]

    setTestResults([...tests])

    // Simulate test progression
    const testTimers: NodeJS.Timeout[] = []

    tests.forEach((test, index) => {
      const timer = setTimeout(
        () => {
          setTestResults((prev) => {
            const updated = [...prev]
            updated[index] = {
              ...updated[index],
              status: Math.random() > 0.8 ? "failed" : "passed",
              details: Math.random() > 0.8 ? "Error detected during test" : "Test completed successfully",
              timestamp: new Date().toLocaleTimeString(),
            }
            return updated
          })

          // If this is the last test, set running to false
          if (index === tests.length - 1) {
            setTimeout(() => setIsRunningTest(false), 500)
          }
        },
        (index + 1) * 1500,
      )

      testTimers.push(timer)
    })

    return () => testTimers.forEach((timer) => clearTimeout(timer))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-500">Passed</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      case "running":
        return <Badge className="bg-blue-500">Running</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const selectedDeviceData = selectedDevice ? devices.find((d) => d.id === selectedDevice) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 md:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Select Device</label>
          <Select value={selectedDevice || ""} onValueChange={setSelectedDevice}>
            <SelectTrigger>
              <SelectValue placeholder="Select a device to diagnose" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" disabled={!selectedDevice || isRunningTest} onClick={() => setSelectedDevice(null)}>
            Clear
          </Button>
          <Button disabled={!selectedDevice || isRunningTest} onClick={handleRunDiagnostics}>
            {isRunningTest ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Diagnostics
              </>
            )}
          </Button>
        </div>
      </div>

      {selectedDevice && selectedDeviceData ? (
        <Tabs defaultValue="diagnostics" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            <TabsTrigger value="logs">Device Logs</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnostics">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">{selectedDeviceData.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Type:</div>
                        <div>{selectedDeviceData.type}</div>

                        <div className="text-muted-foreground">Protocol:</div>
                        <div>{selectedDeviceData.protocol}</div>

                        <div className="text-muted-foreground">Status:</div>
                        <div>
                          <Badge
                            variant={
                              selectedDeviceData.status === "online"
                                ? "success"
                                : selectedDeviceData.status === "warning"
                                  ? "warning"
                                  : selectedDeviceData.status === "error"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {selectedDeviceData.status}
                          </Badge>
                        </div>

                        <div className="text-muted-foreground">Last Seen:</div>
                        <div>{selectedDeviceData.lastSeen}</div>

                        {selectedDeviceData.battery && selectedDeviceData.battery !== "N/A" && (
                          <>
                            <div className="text-muted-foreground">Battery:</div>
                            <div>{selectedDeviceData.battery}</div>
                          </>
                        )}

                        {selectedDeviceData.firmware && (
                          <>
                            <div className="text-muted-foreground">Firmware:</div>
                            <div>{selectedDeviceData.firmware}</div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center items-center p-4 border rounded-lg">
                      {testResults.length > 0 ? (
                        <div className="w-full">
                          <h4 className="text-sm font-medium mb-2">Diagnostic Results</h4>
                          <div className="space-y-2">
                            {testResults.map((test, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  {test.status === "running" && <RefreshCw className="h-3 w-3 animate-spin" />}
                                  {test.status === "passed" && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                  {test.status === "failed" && <AlertTriangle className="h-3 w-3 text-red-500" />}
                                  {test.status === "pending" && <Clock className="h-3 w-3 text-muted-foreground" />}
                                  <span>{test.name}</span>
                                </div>
                                {getStatusBadge(test.status)}
                              </div>
                            ))}
                          </div>

                          {!isRunningTest && (
                            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={handleRunDiagnostics}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Run Again
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <Zap className="h-12 w-12 text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium">Ready to Diagnose</h3>
                          <p className="text-sm text-muted-foreground mb-4">Run diagnostics to check device health</p>
                          <Button onClick={handleRunDiagnostics} disabled={isRunningTest}>
                            Start Diagnostics
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {testResults.some((test) => test.status === "failed") && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-medium mb-2">Recommended Actions</h3>
                    <div className="space-y-2">
                      {testResults
                        .filter((test) => test.status === "failed")
                        .map((test, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                              <div>
                                <h4 className="font-medium">{test.name} Failed</h4>
                                <p className="text-sm text-muted-foreground">{test.details}</p>
                                <div className="mt-2">
                                  <Button variant="outline" size="sm">
                                    Troubleshoot <ArrowRight className="ml-2 h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Device Logs</h3>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-8 h-8" placeholder="Search logs..." />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue placeholder="Log level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Time</TableHead>
                        <TableHead className="w-[100px]">Level</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-xs">10:42:15</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                            ERROR
                          </Badge>
                        </TableCell>
                        <TableCell>Connection timeout after 30s</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">10:41:30</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                            WARN
                          </Badge>
                        </TableCell>
                        <TableCell>Battery level below 20%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">10:40:12</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            INFO
                          </Badge>
                        </TableCell>
                        <TableCell>Device connected to network</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">10:40:05</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            INFO
                          </Badge>
                        </TableCell>
                        <TableCell>Device powered on</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">09:35:22</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                            WARN
                          </Badge>
                        </TableCell>
                        <TableCell>Weak signal strength detected</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">Showing 5 of 127 log entries</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm">
                      Export Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshooting">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Troubleshooting Guide</h3>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium flex items-center">
                      <Wifi className="h-5 w-5 mr-2 text-blue-500" />
                      Connectivity Issues
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">
                      If the device is offline or experiencing connection problems:
                    </p>
                    <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                      <li>Check if the device is powered on</li>
                      <li>Verify network settings are correct</li>
                      <li>Ensure the device is within range of the network</li>
                      <li>Restart the device and check connection again</li>
                      <li>Check for interference from other devices</li>
                    </ol>
                    <Button variant="outline" size="sm" className="mt-3">
                      Run Connection Test
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium flex items-center">
                      <Battery className="h-5 w-5 mr-2 text-green-500" />
                      Battery Problems
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">For devices with battery issues:</p>
                    <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                      <li>Check battery level and replace if necessary</li>
                      <li>Verify charging circuit is functioning properly</li>
                      <li>Test with a known good battery if possible</li>
                      <li>Check for excessive power consumption</li>
                      <li>Consider environmental factors affecting battery life</li>
                    </ol>
                    <Button variant="outline" size="sm" className="mt-3">
                      Battery Diagnostic
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                      Sensor Calibration
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">If sensor readings are inaccurate:</p>
                    <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                      <li>Check if the sensor is clean and unobstructed</li>
                      <li>Run a calibration routine</li>
                      <li>Compare readings with a reference device</li>
                      <li>Check for environmental factors affecting readings</li>
                      <li>Verify sensor is within its operational lifespan</li>
                    </ol>
                    <Button variant="outline" size="sm" className="mt-3">
                      Calibration Wizard
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-2">Common Solutions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Restart Device
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Reset to Factory Defaults
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Update Firmware
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Contact Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Select a Device</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                Choose a device from the dropdown above to view diagnostics, logs, and troubleshooting information.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <div className="rounded-full bg-green-500/10 p-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-sm font-medium">Diagnostics</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <div className="rounded-full bg-blue-500/10 p-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">Logs</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <div className="rounded-full bg-amber-500/10 p-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium">Troubleshooting</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <div className="rounded-full bg-purple-500/10 p-2 mb-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium">Performance</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
