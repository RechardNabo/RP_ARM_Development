import React from 'react';
import { DeviceData } from '../../types';

interface DeviceDataListProps {
  deviceData: DeviceData[];
}

const DeviceDataList: React.FC<DeviceDataListProps> = ({ deviceData }) => {
  if (deviceData.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        No data available for this device
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-96">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {deviceData.slice().reverse().map((data, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                {new Date(data.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`capitalize px-2 py-1 text-xs rounded-full ${
                  data.type === 'read' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : data.type === 'write'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                  {data.type}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs overflow-hidden">
                <div className="font-mono text-xs overflow-x-auto">
                  {typeof data.value === 'object' 
                    ? JSON.stringify(data.value) 
                    : data.value.toString()
                  }
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceDataList;