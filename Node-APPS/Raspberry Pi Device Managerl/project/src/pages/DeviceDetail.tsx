import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDevices } from '../context/DeviceContext';
import { ArrowLeft, PlayCircle, StopCircle, Save, Trash2, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import DeviceDataList from '../components/devices/DeviceDataList';
import DeviceDataChart from '../components/devices/DeviceDataChart';

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getDevice, deviceData, startDevice, stopDevice, updateDevice, deleteDevice, sendCommand } = useDevices();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [device, setDevice] = useState(getDevice(id || ''));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [command, setCommand] = useState('');
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  
  useEffect(() => {
    if (id) {
      const deviceInfo = getDevice(id);
      if (!deviceInfo) {
        toast.error('Device not found');
        navigate('/devices');
        return;
      }
      setDevice(deviceInfo);
      setName(deviceInfo.name);
      setDescription(deviceInfo.description);
    }
  }, [id, getDevice, navigate]);
  
  if (!device) {
    return null; // Already navigating away
  }
  
  const handleSaveChanges = async () => {
    if (!id) return;
    
    try {
      await updateDevice(id, {
        name,
        description,
        updatedAt: new Date().toISOString()
      });
      
      setEditMode(false);
      toast.success('Device updated');
    } catch (err) {
      toast.error('Failed to update device');
      console.error(err);
    }
  };
  
  const handleDeleteDevice = async () => {
    if (!id) return;
    
    if (window.confirm(`Are you sure you want to delete ${device.name}?`)) {
      try {
        await deleteDevice(id);
        toast.success('Device deleted');
        navigate('/devices');
      } catch (err) {
        toast.error('Failed to delete device');
        console.error(err);
      }
    }
  };
  
  const handleToggleDevice = async () => {
    if (!id) return;
    
    try {
      if (device.status === 'online') {
        await stopDevice(id);
        toast.success('Device stopped');
      } else {
        await startDevice(id);
        toast.success('Device started');
      }
    } catch (err) {
      toast.error('Failed to control device');
      console.error(err);
    }
  };
  
  const handleSendCommand = async () => {
    if (!id || !command.trim()) return;
    
    try {
      // Parse command as JSON if possible, otherwise use as string
      let parsedCommand;
      try {
        parsedCommand = JSON.parse(command);
      } catch {
        parsedCommand = command;
      }
      
      await sendCommand(id, parsedCommand);
      toast.success('Command sent');
      setCommand('');
    } catch (err) {
      toast.error('Failed to send command');
      console.error(err);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/devices')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        
        {editMode ? (
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
              placeholder="Device name"
            />
          </div>
        ) : (
          <h1 className="text-2xl font-bold flex-1">{device.name}</h1>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={handleToggleDevice}
            className={`btn flex items-center ${
              device.status === 'online'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            }`}
          >
            {device.status === 'online' ? (
              <>
                <StopCircle size={18} className="mr-2" />
                Stop
              </>
            ) : (
              <>
                <PlayCircle size={18} className="mr-2" />
                Start
              </>
            )}
          </button>
          
          {editMode ? (
            <button
              onClick={handleSaveChanges}
              className="btn btn-primary flex items-center"
            >
              <Save size={18} className="mr-2" />
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="btn bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="card p-4 mb-6">
            <h2 className="text-lg font-medium mb-3">Device Information</h2>
            
            {editMode ? (
              <div className="form-group mb-4">
                <label className="form-label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  rows={3}
                  placeholder="Device description"
                />
              </div>
            ) : (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                <p className="mt-1">{device.description || 'No description'}</p>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
              <p className={`mt-1 capitalize ${
                device.status === 'online' ? 'text-green-600 dark:text-green-400' :
                device.status === 'error' ? 'text-red-600 dark:text-red-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {device.status}
              </p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</h3>
              <p className="mt-1 capitalize">{device.type}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Protocol</h3>
              <p className="mt-1">{device.config.protocol}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h3>
              <p className="mt-1">
                {new Date(device.updatedAt).toLocaleString()}
              </p>
            </div>
            
            {editMode && (
              <button
                onClick={handleDeleteDevice}
                className="btn btn-danger w-full flex items-center justify-center mt-6"
              >
                <Trash2 size={18} className="mr-2" />
                Delete Device
              </button>
            )}
          </div>
          
          <div className="card p-4">
            <h2 className="text-lg font-medium mb-3">Protocol Configuration</h2>
            
            {Object.entries(device.config)
              .filter(([key]) => key !== 'protocol')
              .map(([key, value]) => (
                <div key={key} className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h3>
                  <p className="mt-1">{value?.toString()}</p>
                </div>
              ))}
          </div>
        </div>
        
        <div className="md:col-span-2">
          {device.status === 'online' && (
            <div className="card p-4 mb-6">
              <h2 className="text-lg font-medium mb-3">Send Command</h2>
              <div className="flex">
                <textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="form-input flex-1"
                  rows={3}
                  placeholder="Enter command as text or JSON..."
                />
                <button
                  onClick={handleSendCommand}
                  className="btn btn-primary ml-2 self-end"
                  disabled={!command.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                For JSON commands, use proper syntax. Example: {"{ \"register\": 0, \"value\": 42 }"}
              </p>
            </div>
          )}
          
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Device Data</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setViewMode('chart')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === 'chart'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Chart
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
            
            {viewMode === 'chart' ? (
              <div className="h-64">
                <DeviceDataChart 
                  deviceId={id || ''} 
                  deviceData={deviceData[id || ''] || []} 
                />
              </div>
            ) : (
              <DeviceDataList 
                deviceData={deviceData[id || ''] || []} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetail;