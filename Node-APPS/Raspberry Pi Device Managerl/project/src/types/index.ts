export type ProtocolType = 
  | 'UART' 
  | 'USART' 
  | 'RS232' 
  | 'RS422' 
  | 'RS485' 
  | 'SPI' 
  | 'I2C' 
  | 'SSI'
  | '1-Wire'
  | 'CAN'
  | 'LIN';

export type DeviceType = 
  | 'sensor' 
  | 'actuator' 
  | 'display' 
  | 'communication' 
  | 'custom';

export type DeviceStatus = 'online' | 'offline' | 'error';

export interface DeviceConfig {
  protocol: ProtocolType;
  pins?: number[];
  address?: string;
  baudRate?: number;
  dataBits?: number;
  stopBits?: number;
  parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
  spiMode?: 0 | 1 | 2 | 3;
  spiSpeed?: number;
  i2cAddress?: number;
  i2cBus?: number;
  // Other protocol-specific configurations
  [key: string]: any;
}

export interface Device {
  id: string;
  name: string;
  description: string;
  type: DeviceType;
  status: DeviceStatus;
  config: DeviceConfig;
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceData {
  deviceId: string;
  timestamp: number;
  value: any;
  type: 'read' | 'write';
}

export interface Group {
  id: string;
  name: string;
  description: string;
  devices: string[]; // IDs of devices in this group
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}