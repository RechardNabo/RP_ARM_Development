import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { FloatingThemeToggle } from "@/components/floating-theme-toggle"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>CM4 IoT Management Platform</title>
        <meta name="description" content="Advanced IoT management platform for CM4-IO-WIRELESS-BASE" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <div className="flex min-h-screen flex-col">
              <MainNav />
              <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 overflow-auto">{children}</main>
              </div>
              <FloatingThemeToggle />
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
