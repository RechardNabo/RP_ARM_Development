import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Device, DeviceData } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ActivityChartProps {
  deviceData: Record<string, DeviceData[]>;
  devices: Device[];
}

const ActivityChart: React.FC<ActivityChartProps> = ({ deviceData, devices }) => {
  // Prepare data for the chart
  const chartData = useMemo(() => {
    // Get the last hour of data
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    // Create 12 time slots (5 minutes each)
    const timeSlots = Array.from({ length: 12 }, (_, i) => {
      const time = oneHourAgo + (i * 300000); // 5 minutes in ms
      return time;
    });
    
    // Format time labels
    const labels = timeSlots.map(time => {
      const date = new Date(time);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    // Count events per time slot for each device (max 5 devices)
    const topDevices = devices
      .filter(d => deviceData[d.id] && deviceData[d.id].length > 0)
      .slice(0, 5);
    
    const datasets = topDevices.map((device, index) => {
      const data = timeSlots.map(slotTime => {
        const slotEnd = slotTime + 300000;
        const events = deviceData[device.id]?.filter(
          d => d.timestamp >= slotTime && d.timestamp < slotEnd
        ) || [];
        return events.length;
      });
      
      // Colors for datasets
      const colors = [
        'rgba(59, 130, 246, 0.5)', // blue
        'rgba(20, 184, 166, 0.5)', // teal
        'rgba(249, 115, 22, 0.5)', // orange
        'rgba(139, 92, 246, 0.5)', // purple
        'rgba(16, 185, 129, 0.5)'  // green
      ];
      
      return {
        label: device.name,
        data,
        borderColor: colors[index].replace('0.5', '1'),
        backgroundColor: colors[index],
        fill: true,
        tension: 0.4
      };
    });
    
    return {
      labels,
      datasets
    };
  }, [deviceData, devices]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Event Count'
        },
        ticks: {
          precision: 0
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className="h-full w-full">
      {Object.keys(deviceData).length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">No device activity data available</p>
        </div>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default ActivityChart;