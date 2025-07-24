import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2,
  Cpu,
  PlusCircle
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import DeviceStatusCard from '../components/devices/DeviceStatusCard';
import ActivityChart from '../components/charts/ActivityChart';

const Dashboard: React.FC = () => {
  const { devices, deviceData, loading, error } = useDevices();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    error: 0,
    activityCount: 0
  });

  // Calculate statistics
  useEffect(() => {
    if (devices.length === 0) return;
    
    const online = devices.filter(d => d.status === 'online').length;
    const error = devices.filter(d => d.status === 'error').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    
    // Calculate total activity in last hour
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    let activityCount = 0;
    
    Object.values(deviceData).forEach(dataArray => {
      activityCount += dataArray.filter(d => d.timestamp > oneHourAgo).length;
    });
    
    setStats({
      total: devices.length,
      online,
      offline,
      error,
      activityCount
    });
  }, [devices, deviceData]);

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
          <AlertCircle size={20} className="mr-2" />
          Error
        </h2>
        <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button 
          onClick={() => navigate('/devices/add')} 
          className="btn btn-primary flex items-center"
        >
          <PlusCircle size={18} className="mr-2" />
          Add Device
        </button>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Devices" 
          value={stats.total} 
          icon={<Cpu className="text-blue-500\" size={24} />} 
        />
        <StatCard 
          title="Online" 
          value={stats.online} 
          icon={<CheckCircle2 className="text-green-500\" size={24} />} 
        />
        <StatCard 
          title="Offline" 
          value={stats.offline} 
          icon={<AlertCircle className="text-gray-500\" size={24} />} 
        />
        <StatCard 
          title="Activity (1h)" 
          value={stats.activityCount} 
          icon={<Activity className="text-purple-500\" size={24} />} 
        />
      </div>
      
      {/* Activity Chart */}
      <div className="card p-4">
        <h2 className="text-xl font-semibold mb-4">Device Activity</h2>
        <div className="h-64">
          <ActivityChart deviceData={deviceData} devices={devices} />
        </div>
      </div>
      
      {/* Device Status */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Device Status</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.slice(0, 6).map(device => (
              <DeviceStatusCard key={device.id} device={device} />
            ))}
            {devices.length > 6 && (
              <div className="card p-4 flex items-center justify-center">
                <button 
                  onClick={() => navigate('/devices')} 
                  className="btn btn-secondary"
                >
                  View all devices
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="card p-4">
      <div className="flex items-center">
        <div className="mr-4 p-3 rounded-full bg-gray-100 dark:bg-gray-700">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;