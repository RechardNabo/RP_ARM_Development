import { SPI } from 'spi-device';

export class SPIDevice {
  constructor(deviceConfig, dataCallback) {
    this.config = deviceConfig;
    this.dataCallback = dataCallback;
    this.device = null;
    this.isRunning = false;
    this.simulationMode = process.env.NODE_ENV === 'development' || !this.isRaspberryPi();
    this.simulationInterval = null;
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
      console.log(`Starting SPI device ${this.config.name} in simulation mode`);
      this.startSimulation();
      return;
    }
    
    // Connect to real hardware
    try {
      const { spiBus, spiChipSelect, spiMode, spiSpeed } = this.config.config;
      
      this.device = new SPI.open(
        parseInt(spiBus, 10), 
        parseInt(spiChipSelect, 10), 
        { mode: parseInt(spiMode, 10), maxSpeedHz: parseInt(spiSpeed, 10) }
      );
      
      this.isRunning = true;
      
      // Start reading data periodically if applicable
      this.startReading();
      
      console.log(`Started SPI device ${this.config.name}`);
    } catch (err) {
      console.error(`Failed to start SPI device ${this.config.id}:`, err);
      throw err;
    }
  }
  
  startReading() {
    // SPI is typically master-initiated, but some devices might have periodic reads
    // This would be customized based on the specific device type
    this.readInterval = setInterval(async () => {
      try {
        // Example: Read 2 bytes from the device
        const message = [{
          sendBuffer: Buffer.from([0x00, 0x00]),  // Command to read
          receiveBuffer: Buffer.alloc(2),         // 2 bytes to receive
          byteLength: 2,
          speedHz: parseInt(this.config.config.spiSpeed, 10)
        }];
        
        await new Promise((resolve, reject) => {
          this.device.transfer(message, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        const value = message[0].receiveBuffer.readUInt16BE(0);
        
        this.dataCallback({
          deviceId: this.config.id,
          timestamp: Date.now(),
          value,
          type: 'read'
        });
      } catch (err) {
        console.error(`Error reading from SPI device ${this.config.id}:`, err);
      }
    }, 1000);
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
    
    return new Promise((resolve, reject) => {
      if (this.device) {
        this.device.close(err => {
          if (err) {
            console.error(`Error closing SPI device ${this.config.id}:`, err);
            reject(err);
          } else {
            this.device = null;
            this.isRunning = false;
            console.log(`Stopped SPI device ${this.config.name}`);
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
      console.log(`Simulation: Sending command to SPI device ${this.config.name}:`, command);
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: { command, response: 'Simulated response' },
        type: 'write'
      });
      return { success: true, simulation: true };
    }
    
    return new Promise((resolve, reject) => {
      const sendBuffer = Buffer.from(command.data);
      const message = [{
        sendBuffer,
        receiveBuffer: Buffer.alloc(sendBuffer.length),
        byteLength: sendBuffer.length,
        speedHz: parseInt(this.config.config.spiSpeed, 10)
      }];
      
      this.device.transfer(message, (err) => {
        if (err) {
          console.error(`Error sending command to SPI device ${this.config.id}:`, err);
          reject(err);
        } else {
          this.dataCallback({
            deviceId: this.config.id,
            timestamp: Date.now(),
            value: { 
              command: command.data,
              response: Array.from(message[0].receiveBuffer) 
            },
            type: 'write'
          });
          resolve({ 
            success: true,
            response: Array.from(message[0].receiveBuffer)
          });
        }
      });
    });
  }
  
  // Simulation methods for development/testing
  startSimulation() {
    this.isRunning = true;
    
    // Generate random data at intervals
    this.simulationInterval = setInterval(() => {
      const value = Math.floor(Math.random() * 1024);  // 10-bit value (common for SPI ADCs)
      
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value,
        type: 'read'
      });
    }, 2000);
    
    console.log(`Started SPI device ${this.config.name} in simulation mode`);
  }
  
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
    console.log(`Stopped SPI device ${this.config.name} simulation`);
  }
}