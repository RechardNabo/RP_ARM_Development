import i2c from 'i2c-bus';

export class I2CDevice {
  constructor(deviceConfig, dataCallback) {
    this.config = deviceConfig;
    this.dataCallback = dataCallback;
    this.bus = null;
    this.isRunning = false;
    this.simulationMode = process.env.NODE_ENV === 'development' || !this.isRaspberryPi();
    this.simulationInterval = null;
    this.address = parseInt(this.config.config.i2cAddress, 16);
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
      console.log(`Starting I2C device ${this.config.name} in simulation mode`);
      this.startSimulation();
      return;
    }
    
    // Connect to real hardware
    try {
      const busNumber = parseInt(this.config.config.i2cBus, 10);
      this.bus = await i2c.openPromisified(busNumber);
      
      // Test connection by reading a byte
      try {
        await this.bus.readByte(this.address, 0);
        console.log(`I2C device at address 0x${this.address.toString(16)} connected`);
      } catch (err) {
        console.warn(`Could not read from I2C device at address 0x${this.address.toString(16)}:`, err);
        // We continue anyway as the device might not support reading register 0
      }
      
      this.isRunning = true;
      
      // Start reading data periodically
      this.startReading();
      
      console.log(`Started I2C device ${this.config.name}`);
    } catch (err) {
      console.error(`Failed to start I2C device ${this.config.id}:`, err);
      throw err;
    }
  }
  
  startReading() {
    // In a real implementation, you would set up a polling interval
    // or event handler for the specific I2C device
    this.readInterval = setInterval(async () => {
      try {
        // Read from register 0 as an example
        const value = await this.bus.readByte(this.address, 0);
        
        this.dataCallback({
          deviceId: this.config.id,
          timestamp: Date.now(),
          value: { register: 0, value },
          type: 'read'
        });
      } catch (err) {
        console.error(`Error reading from I2C device ${this.config.id}:`, err);
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
    
    if (this.bus) {
      await this.bus.close();
      this.bus = null;
    }
    
    this.isRunning = false;
    console.log(`Stopped I2C device ${this.config.name}`);
  }
  
  async sendCommand(command) {
    if (!this.isRunning) {
      throw new Error('Device is not running');
    }
    
    if (this.simulationMode) {
      console.log(`Simulation: Sending command to I2C device ${this.config.name}:`, command);
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: { command, response: 'Simulated response' },
        type: 'write'
      });
      return { success: true, simulation: true };
    }
    
    try {
      const { register, value } = command;
      
      if (register === undefined || value === undefined) {
        throw new Error('Command must include register and value');
      }
      
      await this.bus.writeByte(this.address, register, value);
      
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: { register, value },
        type: 'write'
      });
      
      return { success: true };
    } catch (err) {
      console.error(`Error writing to I2C device ${this.config.id}:`, err);
      throw err;
    }
  }
  
  // Simulation methods for development/testing
  startSimulation() {
    this.isRunning = true;
    
    // Generate random data at intervals
    this.simulationInterval = setInterval(() => {
      const registers = [0, 1, 2];
      const register = registers[Math.floor(Math.random() * registers.length)];
      const value = Math.floor(Math.random() * 256);
      
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: { register, value },
        type: 'read'
      });
    }, 2000);
    
    console.log(`Started I2C device ${this.config.name} in simulation mode`);
  }
  
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
    console.log(`Stopped I2C device ${this.config.name} simulation`);
  }
}