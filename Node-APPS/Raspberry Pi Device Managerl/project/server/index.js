import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { UARTDevice } from './devices/UARTDevice.js';
import { SPIDevice } from './devices/SPIDevice.js';
import { I2CDevice } from './devices/I2CDevice.js';
import { CANDevice } from './devices/CANDevice.js';
import { OneWireDevice } from './devices/OneWireDevice.js';

// Convert ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Vite dev server
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Data storage
const DATA_FILE = path.join(__dirname, 'data', 'devices.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
};

// Read devices from file
const getDevices = async () => {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    console.error('Error reading devices:', err);
    return [];
  }
};

// Save devices to file
const saveDevices = async (devices) => {
  try {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(devices, null, 2));
  } catch (err) {
    console.error('Error saving devices:', err);
  }
};

// Map of active device instances
const activeDevices = new Map();

// Create a new device instance based on protocol
const createDeviceInstance = (device) => {
  switch (device.config.protocol) {
    case 'UART':
    case 'USART':
    case 'RS232':
    case 'RS422':
    case 'RS485':
      return new UARTDevice(device, handleDeviceData);
    case 'SPI':
      return new SPIDevice(device, handleDeviceData);
    case 'I2C':
      return new I2CDevice(device, handleDeviceData);
    case 'CAN':
    case 'LIN':
      return new CANDevice(device, handleDeviceData);
    case '1-Wire':
      return new OneWireDevice(device, handleDeviceData);
    default:
      throw new Error(`Unsupported protocol: ${device.config.protocol}`);
  }
};

// Handle data from devices
const handleDeviceData = (data) => {
  io.emit('deviceData', data);
};

// REST API endpoints
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await getDevices();
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

app.get('/api/devices/:id', async (req, res) => {
  try {
    const devices = await getDevices();
    const device = devices.find(d => d.id === req.params.id);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get device' });
  }
});

app.post('/api/devices', async (req, res) => {
  try {
    const devices = await getDevices();
    const newDevice = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    devices.push(newDevice);
    await saveDevices(devices);
    
    res.status(201).json(newDevice);
  } catch (err) {
    console.error('Error adding device:', err);
    res.status(500).json({ error: 'Failed to add device' });
  }
});

app.put('/api/devices/:id', async (req, res) => {
  try {
    const devices = await getDevices();
    const index = devices.findIndex(d => d.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Stop the device if it's active
    if (activeDevices.has(req.params.id)) {
      const deviceInstance = activeDevices.get(req.params.id);
      await deviceInstance.stop();
      activeDevices.delete(req.params.id);
    }
    
    const updatedDevice = {
      ...devices[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    devices[index] = updatedDevice;
    await saveDevices(devices);
    
    res.json(updatedDevice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update device' });
  }
});

app.delete('/api/devices/:id', async (req, res) => {
  try {
    let devices = await getDevices();
    const device = devices.find(d => d.id === req.params.id);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Stop the device if it's active
    if (activeDevices.has(req.params.id)) {
      const deviceInstance = activeDevices.get(req.params.id);
      await deviceInstance.stop();
      activeDevices.delete(req.params.id);
    }
    
    devices = devices.filter(d => d.id !== req.params.id);
    await saveDevices(devices);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

app.post('/api/devices/:id/start', async (req, res) => {
  try {
    const devices = await getDevices();
    const device = devices.find(d => d.id === req.params.id);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Check if device is already active
    if (activeDevices.has(req.params.id)) {
      return res.status(400).json({ error: 'Device is already active' });
    }
    
    try {
      // Create and start device
      const deviceInstance = createDeviceInstance(device);
      await deviceInstance.start();
      
      // Store active device
      activeDevices.set(req.params.id, deviceInstance);
      
      // Update device status
      const updatedDevices = devices.map(d => 
        d.id === req.params.id ? { ...d, status: 'online', updatedAt: new Date().toISOString() } : d
      );
      await saveDevices(updatedDevices);
      
      // Notify clients
      io.emit('deviceStatus', { id: req.params.id, status: 'online' });
      
      res.json({ success: true });
    } catch (err) {
      console.error(`Error starting device ${req.params.id}:`, err);
      
      // Update device status to error
      const updatedDevices = devices.map(d => 
        d.id === req.params.id ? { ...d, status: 'error', updatedAt: new Date().toISOString() } : d
      );
      await saveDevices(updatedDevices);
      
      // Notify clients
      io.emit('deviceStatus', { id: req.params.id, status: 'error' });
      
      return res.status(500).json({ 
        error: 'Failed to start device',
        details: err.message
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to start device' });
  }
});

app.post('/api/devices/:id/stop', async (req, res) => {
  try {
    const devices = await getDevices();
    const device = devices.find(d => d.id === req.params.id);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    if (!activeDevices.has(req.params.id)) {
      return res.status(400).json({ error: 'Device is not active' });
    }
    
    try {
      // Stop device
      const deviceInstance = activeDevices.get(req.params.id);
      await deviceInstance.stop();
      
      // Remove from active devices
      activeDevices.delete(req.params.id);
      
      // Update device status
      const updatedDevices = devices.map(d => 
        d.id === req.params.id ? { ...d, status: 'offline', updatedAt: new Date().toISOString() } : d
      );
      await saveDevices(updatedDevices);
      
      // Notify clients
      io.emit('deviceStatus', { id: req.params.id, status: 'offline' });
      
      res.json({ success: true });
    } catch (err) {
      console.error(`Error stopping device ${req.params.id}:`, err);
      
      // Update device status to error
      const updatedDevices = devices.map(d => 
        d.id === req.params.id ? { ...d, status: 'error', updatedAt: new Date().toISOString() } : d
      );
      await saveDevices(updatedDevices);
      
      // Notify clients
      io.emit('deviceStatus', { id: req.params.id, status: 'error' });
      
      return res.status(500).json({ 
        error: 'Failed to stop device',
        details: err.message
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to stop device' });
  }
});

app.post('/api/devices/:id/command', async (req, res) => {
  try {
    const { id } = req.params;
    const { command } = req.body;
    
    if (!activeDevices.has(id)) {
      return res.status(400).json({ error: 'Device is not active' });
    }
    
    const deviceInstance = activeDevices.get(id);
    const result = await deviceInstance.sendCommand(command);
    
    res.json({ success: true, result });
  } catch (err) {
    console.error(`Error sending command to device ${req.params.id}:`, err);
    res.status(500).json({ 
      error: 'Failed to send command to device',
      details: err.message
    });
  }
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  
  // Stop all active devices
  const stopPromises = [];
  for (const [id, device] of activeDevices.entries()) {
    console.log(`Stopping device: ${id}`);
    stopPromises.push(device.stop().catch(err => {
      console.error(`Error stopping device ${id}:`, err);
    }));
  }
  
  await Promise.all(stopPromises);
  server.close();
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);