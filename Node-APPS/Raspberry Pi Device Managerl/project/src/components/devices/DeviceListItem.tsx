import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';
import { Device } from '../../types';
import { toast } from 'react-toastify';

interface DeviceListItemProps {
  device: Device;
}

const DeviceListItem: React.FC<DeviceListItemProps> = ({ device }) => {
  const { startDevice, stopDevice, deleteDevice } = useDevices();
  const navigate = useNavigate();
  
  const getStatusIndicator = () => {
    switch(device.status) {
      case 'online':
        return (
          <span className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle2 size={16} className="mr-1" />
            Online
          </span>
        );
      case 'offline':
        return (
          <span className="flex items-center text-gray-600 dark:text-gray-400">
            <XCircle size={16} className="mr-1" />
            Offline
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center text-red-600 dark:text-red-400">
            <AlertTriangle size={16} className="mr-1" />
            Error
          </span>
        );
      default:
        return null;
    }
  };
  
  const handleToggle = async () => {
    if (device.status === 'online') {
      const success = await stopDevice(device.id);
      if (success) {
        toast.success(`Device "${device.name}" stopped`);
      }
    } else {
      const success = await startDevice(device.id);
      if (success) {
        toast.success(`Device "${device.name}" started`);
      }
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the device "${device.name}"?`)) {
      const success = await deleteDevice(device.id);
      if (success) {
        toast.success(`Device "${device.name}" deleted`);
      }
    }
  };
  
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <div className="grid grid-cols-12 gap-4 px-6 py-4">
        <div className="col-span-5">
          <div 
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            onClick={() => navigate(`/devices/${device.id}`)}
          >
            {device.name}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
            {device.description}
          </p>
        </div>
        
        <div className="col-span-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full capitalize bg-gray-100 dark:bg-gray-700">
            {device.type}
          </span>
        </div>
        
        <div className="col-span-2">
          {getStatusIndicator()}
        </div>
        
        <div className="col-span-3 flex items-center justify-end space-x-3">
          <button
            onClick={handleToggle}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              device.status === 'online'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            }`}
          >
            {device.status === 'online' ? 'Stop' : 'Start'}
          </button>
          
          <button
            onClick={() => navigate(`/devices/${device.id}`)}
            className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          
          <button
            onClick={handleDelete}
            className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceListItem;