import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Device, DeviceData, DeviceType, ProtocolType } from '../types';
import api from '../services/api';

interface DeviceContextType {
  devices: Device[];
  deviceData: Record<string, DeviceData[]>;
  loading: boolean;
  error: string | null;
  addDevice: (device: Omit<Device, 'id'>) => Promise<Device | null>;
  updateDevice: (id: string, device: Partial<Device>) => Promise<boolean>;
  deleteDevice: (id: string) => Promise<boolean>;
  getDevice: (id: string) => Device | undefined;
  startDevice: (id: string) => Promise<boolean>;
  stopDevice: (id: string) => Promise<boolean>;
  sendCommand: (id: string, command: any) => Promise<boolean>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Dynamically determine the protocol and host
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const host = 'localhost:3000';
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceData, setDeviceData] = useState<Record<string, DeviceData[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(`${wsProtocol}//${host}`);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('deviceData', (data: DeviceData) => {
      setDeviceData(prev => {
        const deviceId = data.deviceId;
        const currentData = prev[deviceId] || [];
        // Keep only the latest 100 data points
        const newData = [...currentData, data].slice(-100);
        return { ...prev, [deviceId]: newData };
      });
    });

    newSocket.on('deviceStatus', ({ id, status }: { id: string; status: 'online' | 'offline' }) => {
      setDevices(prevDevices => 
        prevDevices.map(device => 
          device.id === id ? { ...device, status } : device
        )
      );
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Load devices on initial render
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await api.get('/devices');
        // Ensure devices is always an array
        const devicesData = Array.isArray(response.data) ? response.data : [];
        setDevices(devicesData);
      } catch (err) {
        setError('Failed to load devices');
        console.error(err);
        // Set devices to empty array on error
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Device CRUD operations
  const addDevice = async (device: Omit<Device, 'id'>): Promise<Device | null> => {
    try {
      const response = await api.post('/devices', device);
      const newDevice = response.data;
      setDevices(prev => [...prev, newDevice]);
      return newDevice;
    } catch (err) {
      setError('Failed to add device');
      console.error(err);
      return null;
    }
  };

  const updateDevice = async (id: string, device: Partial<Device>): Promise<boolean> => {
    try {
      await api.put(`/devices/${id}`, device);
      setDevices(prev => 
        prev.map(d => d.id === id ? { ...d, ...device } : d)
      );
      return true;
    } catch (err) {
      setError('Failed to update device');
      console.error(err);
      return false;
    }
  };

  const deleteDevice = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/devices/${id}`);
      setDevices(prev => prev.filter(d => d.id !== id));
      return true;
    } catch (err) {
      setError('Failed to delete device');
      console.error(err);
      return false;
    }
  };

  const getDevice = (id: string): Device | undefined => {
    return devices.find(d => d.id === id);
  };

  // Device control operations
  const startDevice = async (id: string): Promise<boolean> => {
    try {
      await api.post(`/devices/${id}/start`);
      setDevices(prev => 
        prev.map(d => d.id === id ? { ...d, status: 'online' } : d)
      );
      return true;
    } catch (err) {
      setError(`Failed to start device ${id}`);
      console.error(err);
      return false;
    }
  };

  const stopDevice = async (id: string): Promise<boolean> => {
    try {
      await api.post(`/devices/${id}/stop`);
      setDevices(prev => 
        prev.map(d => d.id === id ? { ...d, status: 'offline' } : d)
      );
      return true;
    } catch (err) {
      setError(`Failed to stop device ${id}`);
      console.error(err);
      return false;
    }
  };

  const sendCommand = async (id: string, command: any): Promise<boolean> => {
    try {
      await api.post(`/devices/${id}/command`, { command });
      return true;
    } catch (err) {
      setError(`Failed to send command to device ${id}`);
      console.error(err);
      return false;
    }
  };

  const value = {
    devices,
    deviceData,
    loading,
    error,
    addDevice,
    updateDevice,
    deleteDevice,
    getDevice,
    startDevice,
    stopDevice,
    sendCommand
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevices = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
};