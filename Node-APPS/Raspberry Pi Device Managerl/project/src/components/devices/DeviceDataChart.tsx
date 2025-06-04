import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DeviceData } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DeviceDataChartProps {
  deviceId: string;
  deviceData: DeviceData[];
}

const DeviceDataChart: React.FC<DeviceDataChartProps> = ({ deviceData }) => {
  const chartData = useMemo(() => {
    // Filter to read operations only
    const readData = deviceData.filter(d => d.type === 'read');
    
    if (readData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    // Get last 20 items or fewer
    const dataPoints = readData.slice(-20);
    
    // Format time labels
    const labels = dataPoints.map(d => 
      new Date(d.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    );
    
    // Try to extract numeric values
    const values = dataPoints.map(d => {
      if (typeof d.value === 'number') {
        return d.value;
      } else if (typeof d.value === 'object') {
        // Try to find numeric properties
        const numericValues = Object.entries(d.value)
          .filter(([_, v]) => typeof v === 'number')
          .map(([k, v]) => ({ key: k, value: v }));
          
        if (numericValues.length > 0) {
          // For simplicity, just return the first numeric value
          return numericValues[0].value;
        }
      }
      
      // Fallback to 0 if no numeric value found
      return 0;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Device Data',
          data: values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3
        }
      ]
    };
  }, [deviceData]);
  
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
        beginAtZero: false,
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  if (deviceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No data available for this device</p>
      </div>
    );
  }

  return <Line data={chartData} options={options} />;
};

export default DeviceDataChart;