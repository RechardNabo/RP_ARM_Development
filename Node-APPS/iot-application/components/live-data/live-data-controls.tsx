import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, Clock, Download } from "lucide-react"

export function LiveDataControls() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Chart Controls</CardTitle>
        <CardDescription>Configure chart display options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Play className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Pause className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <Clock className="mr-2 h-4 w-4" />
              Live
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="update-interval">Update Interval</Label>
          <Select defaultValue="1000">
            <SelectTrigger id="update-interval">
              <SelectValue placeholder="Select update interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100ms (Very Fast)</SelectItem>
              <SelectItem value="500">500ms (Fast)</SelectItem>
              <SelectItem value="1000">1s (Normal)</SelectItem>
              <SelectItem value="5000">5s (Slow)</SelectItem>
              <SelectItem value="10000">10s (Very Slow)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="data-points">Data Points</Label>
            <span className="text-xs">100</span>
          </div>
          <Slider id="data-points" defaultValue={[100]} max={500} step={10} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-scale">Auto Scale Y-Axis</Label>
            <Switch id="auto-scale" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-grid">Show Grid Lines</Label>
            <Switch id="show-grid" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-legend">Show Legend</Label>
            <Switch id="show-legend" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-tooltips">Show Tooltips</Label>
            <Switch id="show-tooltips" defaultChecked />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
