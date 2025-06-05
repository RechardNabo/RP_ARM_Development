"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { RefreshCw, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function DashboardHeader() {
  const router = useRouter()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      // In a real implementation, this would fetch fresh data
      // For now, we'll simulate a refresh with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Force a refresh of the current page
      router.refresh()

      toast({
        title: "Dashboard refreshed",
        description: "All dashboard data has been updated.",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "There was an error refreshing the dashboard.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAddDevice = () => {
    router.push("/devices/add")
    toast({
      title: "Add Device",
      description: "Navigating to device creation page.",
    })
  }

  return (
    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your CM4-IO-WIRELESS-BASE system and connected devices</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button onClick={handleAddDevice}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>
    </div>
  )
}
