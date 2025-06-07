"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, HelpCircle, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const mainNavItems = [
  { name: "Dashboard", href: "/" },
  { name: "Devices", href: "/devices" },
  { name: "Live Data", href: "/live-data" },
  { name: "Alerts", href: "/alerts" },
  { name: "Reports", href: "/reports" },
  { name: "Users", href: "/users" },
  { name: "Settings", href: "/settings" },
  { name: "Logs", href: "/logs" },
  { name: "API & Integrations", href: "/api-integrations" },
  { name: "Help", href: "/help" },
]

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center space-x-2 mr-4">
          <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="text-white text-xs font-bold">CM4</span>
          </div>
          <span className="font-bold hidden md:inline-block">CM4 IoT Platform</span>
        </div>

        <nav className="flex-1 overflow-x-auto">
          <ul className="flex space-x-1">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center px-3 text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">3</Badge>
          </Button>
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
