"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Upload, RefreshCw, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function DeviceHeader() {
  const router = useRouter()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Handle Add Device button click
  const handleAddDevice = () => {
    router.push("/devices/add")
  }

  // Handle Import button click
  const handleImport = () => {
    setIsImporting(true)

    // Create a file input element
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = ".json,.csv"

    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            // Process the file content
            const content = event.target?.result as string

            // Show success toast
            toast({
              title: "Import Successful",
              description: `Imported ${file.name} successfully.`,
            })

            // In a real app, you would process the data here
            console.log("Imported content:", content.substring(0, 100) + "...")
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "There was an error importing the file.",
              variant: "destructive",
            })
          }
        }
        reader.readAsText(file)
      }
      setIsImporting(false)
    }

    // Trigger the file input click
    fileInput.click()
  }

  // Handle Export button click
  const handleExport = () => {
    setIsExporting(true)

    try {
      // In a real app, you would fetch the actual device data
      const devices = [
        {
          id: "dev-001",
          name: "Temperature Sensor",
          type: "sensor",
          protocol: "I2C",
          status: "online",
        },
        {
          id: "dev-002",
          name: "Pressure Sensor",
          type: "sensor",
          protocol: "SPI",
          status: "online",
        },
        // Add more mock devices as needed
      ]

      // Convert to JSON
      const jsonData = JSON.stringify(devices, null, 2)

      // Create a blob and download link
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `devices-export-${new Date().toISOString().split("T")[0]}.json`

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Show success toast
      toast({
        title: "Export Successful",
        description: "Devices exported successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the devices.",
        variant: "destructive",
      })
    }

    setIsExporting(false)
  }

  // Handle Refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true)

    // Simulate a refresh operation
    setTimeout(() => {
      // In a real app, you would fetch fresh data here
      router.refresh() // Refresh the current page

      toast({
        title: "Refreshed",
        description: "Device list has been refreshed.",
      })

      setIsRefreshing(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Devices</h2>
        <p className="text-muted-foreground">Manage and monitor all connected devices</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" className="h-9" onClick={handleImport} disabled={isImporting}>
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button size="sm" className="h-9" onClick={handleAddDevice}>
          <Plus className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>
    </div>
  )
}
