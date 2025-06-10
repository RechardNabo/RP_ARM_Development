"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Loader2, AlertCircle } from "lucide-react"
import { useSystemMetrics } from "@/hooks/use-system-metrics"
import { useState, useEffect } from "react"

export interface SystemService {
  name: string;
  status: 'active' | 'inactive' | 'failed' | 'activating' | 'unknown';
  description: string;
}

// Default service list to show when no data is available
const DEFAULT_SERVICES = [
  { name: "can0-interface", description: "CAN0 Interface Setup", status: "unknown" },
  { name: "influxdb", description: "InfluxDB Time Series Database", status: "unknown" },
  { name: "mongod", description: "MongoDB Database Server", status: "unknown" },
  { name: "grafana-server", description: "Grafana Dashboard", status: "unknown" },
  { name: "nginx", description: "Web Server", status: "unknown" },
  { name: "webmin", description: "Webmin Administration", status: "unknown" },
];

export function ServiceMonitor() {
  const { data: metrics, isLoading, error, refresh } = useSystemMetrics();
  const [retryCount, setRetryCount] = useState(0);
  
  // Add additional retry logic for data fetching
  useEffect(() => {
    if (error || (!metrics?.services && !isLoading && retryCount < 3)) {
      const timer = setTimeout(() => {
        refresh(); // Use the refresh function from the hook
        setRetryCount(prev => prev + 1);
      }, 2000); // Retry after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [metrics, error, isLoading, retryCount, refresh]);

  // Use actual services data when available, otherwise use placeholders
  const servicesList = metrics?.services?.length > 0 
    ? metrics.services 
    : DEFAULT_SERVICES;
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          System Services
        </CardTitle>
        <div className="flex items-center">
          {isLoading && <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin mr-2" />}
          <Shield className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Always show service cards, badges update dynamically */}
          {servicesList.map(service => (
            <div 
              key={service.name}
              className="flex items-center justify-between bg-background p-3 rounded-lg border"
            >
              <div>
                <p className="text-sm font-medium">{service.name}</p>
                <p className="text-xs text-muted-foreground">{service.description}</p>
              </div>
              <Badge 
                className={
                  `${service.status === 'active' ? 'bg-green-500 hover:bg-green-600' :
                  service.status === 'inactive' ? 'bg-gray-500 hover:bg-gray-600' :
                  service.status === 'failed' ? 'bg-red-500 hover:bg-red-600' : 
                  service.status === 'activating' ? 'bg-blue-500 hover:bg-blue-600' :
                  'bg-amber-500 hover:bg-amber-600'}`
                }
              >
                {service.status}
              </Badge>
            </div>
          ))}

          {/* Show error message only if we've tried multiple times and still have errors */}
          {error && retryCount >= 3 && (
            <div className="mt-4 p-2 bg-destructive/10 rounded-md">
              <div className="flex items-center gap-2 justify-center">
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                <p className="text-xs text-destructive text-center">
                  {error?.message || "Connection error"}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
