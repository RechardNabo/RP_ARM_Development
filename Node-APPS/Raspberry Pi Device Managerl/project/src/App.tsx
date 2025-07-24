import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import AddDevice from './pages/AddDevice';
import Settings from './pages/Settings';
import { DeviceProvider } from './context/DeviceContext';
import NotFound from './pages/NotFound';

function App() {
  return (
    <DeviceProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="devices/:id" element={<DeviceDetail />} />
          <Route path="devices/add" element={<AddDevice />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </DeviceProvider>
  );
}

export default App;