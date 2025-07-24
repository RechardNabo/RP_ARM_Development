import { spawn } from 'child_process';

export class CANDevice {
  constructor(deviceConfig, dataCallback) {
    this.config = deviceConfig;
    this.dataCallback = dataCallback;
    this.candumpProcess = null;
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
      console.log(`Starting CAN device ${this.config.name} in simulation mode`);
      this.startSimulation();
      return;
    }
    
    // Connect to real hardware
    try {
      const { canInterface, canBitrate } = this.config.config;
      
      // Set up the CAN interface if not already up
      try {
        await this.runCommand('ip', ['link', 'set', canInterface, 'up', 'type', 'can', 'bitrate', canBitrate]);
      } catch (err) {
        console.warn(`Error setting up CAN interface ${canInterface}:`, err);
        // Continue anyway, as interface might already be up
      }
      
      // Start candump to listen for messages
      this.candumpProcess = spawn('candump', [canInterface]);
      
      this.candumpProcess.stdout.on('data', (data) => {
        // Parse candump output
        // Format is typically: can0  123  [8] 11 22 33 44 55 66 77 88
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
          const match = line.match(/(\S+)\s+(\S+)\s+\[(\d+)\]\s+(.*)/);
          if (match) {
            const [, iface, id, dlc, dataStr] = match;
            const bytes = dataStr.trim().split(' ').map(b => parseInt(b, 16));
            
            this.dataCallback({
              deviceId: this.config.id,
              timestamp: Date.now(),
              value: {
                interface: iface,
                id,
                dlc: parseInt(dlc, 10),
                data: bytes
              },
              type: 'read'
            });
          }
        }
      });
      
      this.candumpProcess.stderr.on('data', (data) => {
        console.error(`candump stderr for device ${this.config.id}:`, data.toString());
      });
      
      this.candumpProcess.on('close', (code) => {
        if (this.isRunning) {
          console.log(`candump process exited with code ${code}`);
          this.isRunning = false;
        }
      });
      
      this.isRunning = true;
      console.log(`Started CAN device ${this.config.name}`);
    } catch (err) {
      console.error(`Failed to start CAN device ${this.config.id}:`, err);
      throw err;
    }
  }
  
  async stop() {
    if (!this.isRunning) return;
    
    if (this.simulationMode) {
      this.stopSimulation();
      return;
    }
    
    if (this.candumpProcess) {
      this.candumpProcess.kill();
      this.candumpProcess = null;
    }
    
    this.isRunning = false;
    console.log(`Stopped CAN device ${this.config.name}`);
  }
  
  async sendCommand(command) {
    if (!this.isRunning) {
      throw new Error('Device is not running');
    }
    
    if (this.simulationMode) {
      console.log(`Simulation: Sending command to CAN device ${this.config.name}:`, command);
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: { command, response: 'Simulated response' },
        type: 'write'
      });
      return { success: true, simulation: true };
    }
    
    try {
      const { canInterface } = this.config.config;
      const { id, data } = command;
      
      // Validate command
      if (!id || !data || !Array.isArray(data)) {
        throw new Error('Command must include id and data array');
      }
      
      // Convert data to hex string
      const hexData = data.map(b => b.toString(16).padStart(2, '0')).join(' ');
      
      // Send CAN frame using cansend
      await this.runCommand('cansend', [`${canInterface}#${id}#${hexData}`]);
      
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: { id, data },
        type: 'write'
      });
      
      return { success: true };
    } catch (err) {
      console.error(`Error sending command to CAN device ${this.config.id}:`, err);
      throw err;
    }
  }
  
  runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data;
      });
      
      process.stderr.on('data', (data) => {
        stderr += data;
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
    });
  }
  
  // Simulation methods for development/testing
  startSimulation() {
    this.isRunning = true;
    
    // Generate random CAN frames at intervals
    this.simulationInterval = setInterval(() => {
      // Generate a random CAN ID (standard format 11-bit)
      const id = Math.floor(Math.random() * 0x7FF).toString(16).padStart(3, '0');
      
      // Generate random data bytes (1-8 bytes)
      const dlc = Math.floor(Math.random() * 8) + 1;
      const data = Array.from({ length: dlc }, () => Math.floor(Math.random() * 256));
      
      this.dataCallback({
        deviceId: this.config.id,
        timestamp: Date.now(),
        value: {
          interface: this.config.config.canInterface,
          id,
          dlc,
          data
        },
        type: 'read'
      });
    }, 2000);
    
    console.log(`Started CAN device ${this.config.name} in simulation mode`);
  }
  
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
    console.log(`Stopped CAN device ${this.config.name} simulation`);
  }
}