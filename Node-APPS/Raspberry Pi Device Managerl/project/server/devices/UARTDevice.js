import { SerialPort } from 'serialport';

export class UARTDevice {
  constructor(deviceConfig, dataCallback) {
    this.config = deviceConfig;
    this.dataCallback = dataCallback;
    this.port = null;
    this.isRunning = false;
    this.simulationMode = process.env.NODE_ENV === 'development' || !this.isRaspberryPi();
    this.simulationInterval = null;
  }
  
  // Check if running on Raspberry Pi
  isRaspberryPi() {
    try {
      // Check for Raspberry Pi specific file
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
      console.log(`Starting UART device ${this.config.name} in simulation mode`);
      this.startSimulation();
      return;
    }
    
    // Connect to real hardware
    try {
      const { baudRate, dataBits, stopBits, parity, serialPath } = this.config.config;
      
      this.port = new SerialPort({
        path: serialPath,
        baudRate: parseInt(baudRate, 10),
        dataBits: parseInt(dataBits, 10),
        stopBits: parseFloat(stopBits),
        parity: parity
      });
      
      this.port.on('data', (data) => {
        this.dataCallback({
          deviceId: this.config.id,
          timestamp: Date.now(),
          value: data.toString('hex'),
          type: 'read'
        });
      });
      
      this.port.on('error', (err) => {
        console.error(`Error from UART device ${this.config.id}:`, err);
        this.dataCallback({
          deviceId: this.config.id,
          timestamp: Date.now(),
          value: { error: err.message },
          type: 'error'
        });
      });
      
      this.isRunning = true;
      console.log(`Started UART device ${this.config.name}`);
    } catch (err) {
      console.error(`Failed to start UART device ${this.config.id}:`, err);
      throw err;
    }
  }
  
  async stop() {
    if (!this.isRunning) return;
    
    if (this.simulationMode) {
      this.stopSimulation();
      return;
    }
    
    return new Promise((resolve, reject) => {
      if (this.port) {
        this.port.close((err) => {
          if (err) {
            console.error(`Error closing UART port for device ${this.config.id}:`, err);
            reject(err);
          } else {
            this.port = null;
            this.isRunning = false;
            console.log(`Stopped UART device ${this.config.name}`);
            resolve();
          }
        });
      } else {
        this.isRunning = false;
        resolve();
      }
    });
  }
  
  async sendCommand(command) {
    if (!this.isRunning) {
      throw new Error('Device is not running');
    }
    
    if (this.simulationMode) {
      console.log(`Simulation: Sending command to UART device ${this.config.name}:`, command);
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: { command, response: 'Simulated response' },
        type: 'write'
      });
      return { success: true, simulation: true };
    }
    
    return new Promise((resolve, reject) => {
      if (!this.port) {
        return reject(new Error('Serial port not open'));
      }
      
      const buffer = Buffer.from(command);
      this.port.write(buffer, (err) => {
        if (err) {
          console.error(`Error writing to UART device ${this.config.id}:`, err);
          reject(err);
        } else {
          this.dataCallback({
            deviceId: this.config.id,
            timestamp: Date.now(),
            value: { command, hex: buffer.toString('hex') },
            type: 'write'
          });
          resolve({ success: true });
        }
      });
    });
  }
  
  // Simulation methods for development/testing
  startSimulation() {
    this.isRunning = true;
    
    // Generate random data at intervals
    this.simulationInterval = setInterval(() => {
      // Generate random bytes
      const randomData = Buffer.alloc(4);
      for (let i = 0; i < 4; i++) {
        randomData[i] = Math.floor(Math.random() * 256);
      }
      
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: randomData.toString('hex'),
        type: 'read'
      });
    }, 2000);
    
    console.log(`Started UART device ${this.config.name} in simulation mode`);
  }
  
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
    console.log(`Stopped UART device ${this.config.name} simulation`);
  }
}