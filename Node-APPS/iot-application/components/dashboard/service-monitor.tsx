import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Server, Activity, Globe, Cpu, RefreshCcw } from "lucide-react"
import { useSystemMetrics } from "@/hooks/use-system-metrics"
import { useState, useEffect } from "react"

export interface SystemService {
  name: string;
  status: 'active' | 'inactive' | 'failed' | 'activating' | 'unknown';
  description: string;
}

export function ServiceMonitor() {
  const { data: metrics, isLoading, error } = useSystemMetrics();

  const getServiceIcon = (serviceName: string) => {
    const lowerName = serviceName.toLowerCase();
    if (lowerName.includes('mongo')) return Database;
    if (lowerName.includes('influx')) return Database;
    if (lowerName.includes('grafana')) return Activity;
    if (lowerName.includes('nginx')) return Globe;
    if (lowerName.includes('webmin')) return Server;
    if (lowerName.includes('spi')) return Cpu;
    if (lowerName.includes('i2c')) return Cpu;
    if (lowerName.includes('can')) return Cpu;
    return Server;
  };

  const getBadgeColor = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'failed':
        return 'bg-red-500';
      case 'activating':
        return 'bg-blue-500';
      default:
        return 'bg-amber-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>System Services</CardTitle>
          <CardDescription>Status of running services and interfaces</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <RefreshCcw className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-400">Loading services...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics || !metrics.services) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>System Services</CardTitle>
          <CardDescription>Status of running services and interfaces</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Could not load service data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>System Services</CardTitle>
        <CardDescription>Status of running services and interfaces</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metrics.services.map((service: SystemService) => {
            const ServiceIcon = getServiceIcon(service.name);
            const badgeColor = getBadgeColor(service.status);
            
            return (
              <div key={service.name} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <ServiceIcon className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">{service.description || service.name}</span>
                </div>
                <Badge 
                  className={`${badgeColor} text-white hover:${badgeColor}`}
                >
                  {service.status === 'active' ? 'Running' : 
                   service.status === 'activating' ? 'Activating' : 
                   service.status === 'inactive' ? 'Inactive' : 
                   service.status === 'failed' ? 'Failed' : 'Unknown'}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  )
}
