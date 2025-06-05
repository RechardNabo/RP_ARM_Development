"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  Home,
  Layers,
  Activity,
  Bell,
  BarChart,
  Users,
  Settings,
  FileText,
  Globe,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Updated sidebar items with correct paths
const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
    items: [
      { title: "Overview", href: "/dashboard" },
      { title: "Active Alerts", href: "/dashboard/active-alerts" },
      { title: "Network Status", href: "/dashboard/network-status" },
      { title: "Location Map", href: "/dashboard/location-map" },
    ],
  },
  {
    title: "Devices",
    icon: Layers,
    href: "/devices",
    items: [
      { title: "Device List", href: "/devices" },
      { title: "Add Device", href: "/devices/add" },
      { title: "Configure Device", href: "/devices/configure" },
      { title: "Device Health", href: "/devices/health" },
      { title: "Protocol Settings", href: "/devices/protocols" },
    ],
  },
  // Other menu items remain the same
  {
    title: "Live Data",
    icon: Activity,
    href: "/live-data",
    items: [
      { title: "Real-time Graphs", href: "/live-data" },
      { title: "Historical Trends", href: "/live-data/historical" },
      { title: "Custom Dashboards", href: "/live-data/custom" },
      { title: "Protocol Monitoring", href: "/live-data/protocols" },
    ],
  },
  {
    title: "Alerts",
    icon: Bell,
    href: "/alerts",
    items: [
      { title: "Active Alerts", href: "/alerts" },
      { title: "Alert Logs", href: "/alerts/logs" },
      { title: "Threshold Settings", href: "/alerts/thresholds" },
      { title: "Notification Settings", href: "/alerts/notifications" },
    ],
  },
  {
    title: "Reports",
    icon: BarChart,
    href: "/reports",
    items: [
      { title: "Generate Reports", href: "/reports" },
      { title: "Export Data", href: "/reports/export" },
      { title: "Predictive Analytics", href: "/reports/analytics" },
    ],
  },
  {
    title: "Users",
    icon: Users,
    href: "/users",
    items: [
      { title: "User List", href: "/users" },
      { title: "Role Management", href: "/users/roles" },
      { title: "Security & Permissions", href: "/users/security" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    items: [
      { title: "Communication Protocols", href: "/settings" },
      { title: "Cloud & Database Setup", href: "/settings/cloud" },
      { title: "Localization & Preferences", href: "/settings/preferences" },
    ],
  },
  {
    title: "Logs",
    icon: FileText,
    href: "/logs",
    items: [
      { title: "System Logs", href: "/logs" },
      { title: "Debugging Tools", href: "/logs/debug" },
      { title: "Protocol-Specific Logs", href: "/logs/protocols" },
    ],
  },
  {
    title: "API & Integrations",
    icon: Globe,
    href: "/api-integrations",
    items: [
      { title: "API Keys", href: "/api-integrations" },
      { title: "Webhooks", href: "/api-integrations/webhooks" },
      { title: "Third-Party Services", href: "/api-integrations/services" },
    ],
  },
  {
    title: "Help",
    icon: HelpCircle,
    href: "/help",
    items: [
      { title: "Documentation", href: "/help" },
      { title: "Support Tickets", href: "/help/support" },
      { title: "Community Forum", href: "/help/community" },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  // Initialize open sections based on current path
  useEffect(() => {
    const initialOpenSections: Record<string, boolean> = {}
    sidebarItems.forEach((item) => {
      // Check if current path matches this section or any of its children
      const isActive =
        pathname === item.href ||
        (pathname === "/" && item.href === "/dashboard") || // Special case for root path
        pathname.startsWith(item.href + "/") ||
        item.items?.some((subItem) => pathname === subItem.href || pathname.startsWith(subItem.href + "/"))

      initialOpenSections[item.title] = isActive
    })
    setOpenSections(initialOpenSections)
  }, [pathname])

  const toggleSection = (title: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  // Check if a path is active (exact match or child route)
  const isPathActive = (path: string) => {
    if (path === "/dashboard" && (pathname === "/" || pathname === "/dashboard")) {
      return true
    }
    return pathname === path || pathname.startsWith(path + "/")
  }

  return (
    <div className="hidden md:block border-r w-64 h-[calc(100vh-3.5rem)]">
      <ScrollArea className="h-full py-2">
        <div className="space-y-1 px-2">
          {sidebarItems.map((item) => (
            <Collapsible key={item.title} open={openSections[item.title]} className="w-full">
              <div className="flex items-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex-1 flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isPathActive(item.href) && "bg-muted",
                  )}
                  onClick={(e) => {
                    // Prevent navigation if clicking on the toggle
                    if ((e.target as HTMLElement).closest(".section-toggle")) {
                      e.preventDefault()
                    }
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
                <CollapsibleTrigger asChild>
                  <button
                    className="section-toggle px-2 py-2 rounded-md hover:bg-muted"
                    onClick={(e) => toggleSection(item.title, e)}
                  >
                    {openSections[item.title] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="pl-6 space-y-1">
                {item.items?.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex items-center py-2 px-2 text-sm rounded-md hover:bg-muted",
                      isPathActive(subItem.href) && "bg-muted font-medium",
                    )}
                  >
                    {subItem.title}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
