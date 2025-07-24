import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  Filter,
  AlertTriangle,
  ArrowDownUp
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import DeviceListItem from '../components/devices/DeviceListItem';

const Devices: React.FC = () => {
  const { devices, loading, error } = useDevices();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'status' | 'updatedAt'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'name' | 'type' | 'status' | 'updatedAt') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const filteredDevices = devices
    .filter(device => {
      // Apply search filter
      const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      const matchesFilter = 
        filter === 'all' || 
        (filter === 'online' && device.status === 'online') ||
        (filter === 'offline' && device.status === 'offline') ||
        (filter === 'error' && device.status === 'error');
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Apply sorting
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg border border-red-300 dark:border-red-800">
        <h2 className="text-red-800 dark:text-red-400 text-lg font-medium flex items-center">
          <AlertTriangle size={20} className="mr-2" />
          Error
        </h2>
        <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Devices</h1>
        <button 
          onClick={() => navigate('/devices/add')} 
          className="btn btn-primary flex items-center"
        >
          <PlusCircle size={18} className="mr-2" />
          Add Device
        </button>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-500" />
          </div>
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Filter size={18} className="text-gray-500" />
            </div>
            <select
              className="form-select pl-10"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Device List */}
      {devices.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No devices configured yet</p>
          <button 
            onClick={() => navigate('/devices/add')} 
            className="btn btn-primary"
          >
            Add your first device
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-5 flex items-center cursor-pointer" onClick={() => handleSort('name')}>
                Device Name
                {sortBy === 'name' && (
                  <ArrowDownUp size={14} className="ml-1" />
                )}
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort('type')}>
                Type
                {sortBy === 'type' && (
                  <ArrowDownUp size={14} className="ml-1" />
                )}
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort('status')}>
                Status
                {sortBy === 'status' && (
                  <ArrowDownUp size={14} className="ml-1" />
                )}
              </div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
          </div>
          
          {/* Table Body */}
          <div>
            {filteredDevices.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                No devices match your search criteria
              </div>
            ) : (
              filteredDevices.map(device => (
                <DeviceListItem key={device.id} device={device} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;