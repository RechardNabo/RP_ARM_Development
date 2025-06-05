"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Power, Fan, Lightbulb, Thermometer } from "lucide-react"

export function DeviceControls() {
  const [fanSpeed, setFanSpeed] = useState(50)
  const [lightBrightness, setLightBrightness] = useState(75)
  const [fanPower, setFanPower] = useState(true)
  const [lightPower, setLightPower] = useState(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Controls</CardTitle>
        <CardDescription>Control connected IoT devices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fan className="h-4 w-4 text-blue-500" />
                <Label htmlFor="fan-switch" className="text-sm font-medium">
                  Fan Control
                </Label>
              </div>
              <Switch id="fan-switch" checked={fanPower} onCheckedChange={setFanPower} />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="fan-speed" className="text-xs text-muted-foreground">
                  Fan Speed
                </Label>
                <span className="text-xs font-medium">{fanSpeed}%</span>
              </div>
              <Slider
                id="fan-speed"
                disabled={!fanPower}
                min={0}
                max={100}
                step={1}
                value={[fanSpeed]}
                onValueChange={(value) => setFanSpeed(value[0])}
              />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <Label htmlFor="light-switch" className="text-sm font-medium">
                  Light Control
                </Label>
              </div>
              <Switch id="light-switch" checked={lightPower} onCheckedChange={setLightPower} />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="light-brightness" className="text-xs text-muted-foreground">
                  Brightness
                </Label>
                <span className="text-xs font-medium">{lightBrightness}%</span>
              </div>
              <Slider
                id="light-brightness"
                disabled={!lightPower}
                min={0}
                max={100}
                step={1}
                value={[lightBrightness]}
                onValueChange={(value) => setLightBrightness(value[0])}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              <span>Set Temperature</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Power className="h-4 w-4" />
              <span>Restart Device</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
