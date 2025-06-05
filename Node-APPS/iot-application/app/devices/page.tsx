"use client"

import { useState } from "react"
import { DeviceList } from "@/components/devices/device-list"
import { DeviceFilters } from "@/components/devices/device-filters"
import { DeviceHeader } from "@/components/devices/device-header"
import type { DeviceFilters as DeviceFiltersType } from "@/components/devices/device-filters"

export default function DevicesPage() {
  const [filters, setFilters] = useState<DeviceFiltersType | null>(null)

  return (
    <div className="p-6 space-y-6">
      <DeviceHeader />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <DeviceFilters onFiltersChange={setFilters} />
        </div>
        <div className="flex-1">
          <DeviceList filters={filters} />
        </div>
      </div>
    </div>
  )
}
