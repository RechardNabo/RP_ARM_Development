import fs from 'fs/promises';
import { constants } from 'fs';
import path from 'path';

export class OneWireDevice {
  constructor(deviceConfig, dataCallback) {
    this.config = deviceConfig;
    this.dataCallback = dataCallback;
    this.isRunning = false;
    this.simulationMode = process.env.NODE_ENV === 'development' || !this.isRaspberryPi();
    this.simulationInterval = null;
    this.readInterval = null;
  }
  
  // Check if running on Raspberry Pi
  isRaspberryPi() {
    try {
      const fs = require('fs');
      return fs.existsSync('/proc/device-tree/model') && 
             fs.readFileSync('/proc/device-tree/model', 'utf8').includes('Raspberry Pi');
    } catch (err) {
      return false;
    }
  }
  
  async start() {
    if (this.isRunning) return;
    
    if (this.simulationMode) {
      console.log(`Starting 1-Wire device ${this.config.name} in simulation mode`);
      this.startSimulation();
      return;
    }
    
    // Connect to real hardware
    try {
      const deviceId = this.config.config.oneWireId;
      const devicePath = `/sys/bus/w1/devices/${deviceId}/w1_slave`;
      
      // Check if device exists
      try {
        await fs.access(devicePath, constants.R_OK);
      } catch (err) {
        throw new Error(`1-Wire device ${deviceId} not found at ${devicePath}`);
      }
      
      this.devicePath = devicePath;
      this.isRunning = true;
      
      // Start reading data periodically
      this.startReading();
      
      console.log(`Started 1-Wire device ${this.config.name}`);
    } catch (err) {
      console.error(`Failed to start 1-Wire device ${this.config.id}:`, err);
      throw err;
    }
  }
  
  async startReading() {
    this.readInterval = setInterval(async () => {
      try {
        const data = await fs.readFile(this.devicePath, 'utf8');
        
        // Parse data based on device type
        if (this.devicePath.includes('28-')) {
          // DS18B20 temperature sensor
          const match = data.match(/t=(\d+)/);
          if (match) {
            const temp = parseInt(match[1], 10) / 1000; // Convert to Celsius
            
            this.dataCallback({
              deviceId: this.config.id,
              timestamp: Date.now(),
              value: { temperature: temp },
              type: 'read'
            });
          }
        } else {
          // Generic 1-Wire device, just return raw data
          this.dataCallback({
            deviceId: this.config.id,
            timestamp: Date.now(),
            value: { raw: data.trim() },
            type: 'read'
          });
        }
      } catch (err) {
        console.error(`Error reading from 1-Wire device ${this.config.id}:`, err);
      }
    }, 2000);
  }
  
  async stop() {
    if (!this.isRunning) return;
    
    if (this.simulationMode) {
      this.stopSimulation();
      return;
    }
    
    if (this.readInterval) {
      clearInterval(this.readInterval);
      this.readInterval = null;
    }
    
    this.isRunning = false;
    console.log(`Stopped 1-Wire device ${this.config.name}`);
  }
  
  async sendCommand(command) {
    if (!this.isRunning) {
      throw new Error('Device is not running');
    }
    
    if (this.simulationMode) {
      console.log(`Simulation: Sending command to 1-Wire device ${this.config.name}:`, command);
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: { command, response: 'Simulated response' },
        type: 'write'
      });
      return { success: true, simulation: true };
    }
    
    // Most 1-Wire devices are read-only, but some might support commands
    // This would need to be implemented based on the specific device type
    throw new Error('Command not supported for this 1-Wire device');
  }
  
  // Simulation methods for development/testing
  startSimulation() {
    this.isRunning = true;
    
    // For temperature sensor simulation
    let temp = 22.5; // Start at room temperature
    
    this.simulationInterval = setInterval(() => {
      // Add some random fluctuation
      temp += (Math.random() - 0.5) * 0.2;
      
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: { temperature: parseFloat(temp.toFixed(2)) },
        type: 'read'
      });
    }, 2000);
    
    console.log(`Started 1-Wire device ${this.config.name} in simulation mode`);
  }
  
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
    console.log(`Stopped 1-Wire device ${this.config.name} simulation`);
  }
}