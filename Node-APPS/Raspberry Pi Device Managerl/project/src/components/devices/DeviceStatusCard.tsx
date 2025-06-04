import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  ArrowRight 
} from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';
import { Device } from '../../types';

interface DeviceStatusCardProps {
  device: Device;
}

const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({ device }) => {
  const { startDevice, stopDevice } = useDevices();
  const navigate = useNavigate();
  
  const getStatusIndicator = () => {
    switch(device.status) {
      case 'online':
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 'offline':
        return <XCircle size={20} className="text-gray-500" />;
      case 'error':
        return <AlertTriangle size={20} className="text-red-500" />;
      default:
        return null;
    }
  };
  
  const getProtocolColor = () => {
    switch(device.config.protocol) {
      case 'UART':
      case 'USART':
      case 'RS232':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'SPI':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'I2C':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'RS422':
      case 'RS485':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300';
      case '1-Wire':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'CAN':
      case 'LIN':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const handleToggle = async () => {
    if (device.status === 'online') {
      await stopDevice(device.id);
    } else {
      await startDevice(device.id);
    }
  };
  
  return (
    <div className="device-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-lg">{device.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{device.description}</p>
        </div>
        <div className="flex items-center">
          {getStatusIndicator()}
        </div>
      </div>
      
      <div className="flex items-center mt-2 mb-4">
        <div className={`text-xs px-2 py-1 rounded ${getProtocolColor()}`}>
          {device.config.protocol}
        </div>
        <div className="text-xs px-2 py-1 ml-2 rounded bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
          {device.type}
        </div>
        <div className="ml-auto">
          <Activity size={16} className="text-blue-500 animate-pulse-slow" />
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={handleToggle}
          className={`px-3 py-1 text-sm font-medium rounded-md ${
            device.status === 'online'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30'
              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30'
          }`}
        >
          {device.status === 'online' ? 'Stop' : 'Start'}
        </button>
        
        <button
          onClick={() => navigate(`/devices/${device.id}`)}
          className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Details
          <ArrowRight size={14} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default DeviceStatusCard;