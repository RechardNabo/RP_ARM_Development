import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { ProtocolType } from '../../types';

interface ProtocolFieldsProps {
  protocol: ProtocolType;
  control: Control<any>;
  errors: FieldErrors<any>;
}

const ProtocolFields: React.FC<ProtocolFieldsProps> = ({ protocol, control, errors }) => {
  switch (protocol) {
    case 'UART':
    case 'USART':
    case 'RS232':
    case 'RS422':
    case 'RS485':
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="form-group">
            <label htmlFor="baudRate\" className="form-label">Baud Rate *</label>
            <Controller
              name="baudRate"
              control={control}
              rules={{ required: "Baud rate is required" }}
              defaultValue={9600}
              render={({ field }) => (
                <select {...field} id="baudRate" className={`form-select ${errors.baudRate ? 'border-red-500' : ''}`}>
                  <option value="1200">1200</option>
                  <option value="2400">2400</option>
                  <option value="4800">4800</option>
                  <option value="9600">9600</option>
                  <option value="19200">19200</option>
                  <option value="38400">38400</option>
                  <option value="57600">57600</option>
                  <option value="115200">115200</option>
                </select>
              )}
            />
            {errors.baudRate && <p className="mt-1 text-sm text-red-600">{errors.baudRate.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="dataBits" className="form-label">Data Bits *</label>
            <Controller
              name="dataBits"
              control={control}
              rules={{ required: "Data bits is required" }}
              defaultValue={8}
              render={({ field }) => (
                <select {...field} id="dataBits" className={`form-select ${errors.dataBits ? 'border-red-500' : ''}`}>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              )}
            />
            {errors.dataBits && <p className="mt-1 text-sm text-red-600">{errors.dataBits.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="stopBits" className="form-label">Stop Bits *</label>
            <Controller
              name="stopBits"
              control={control}
              rules={{ required: "Stop bits is required" }}
              defaultValue={1}
              render={({ field }) => (
                <select {...field} id="stopBits" className={`form-select ${errors.stopBits ? 'border-red-500' : ''}`}>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                </select>
              )}
            />
            {errors.stopBits && <p className="mt-1 text-sm text-red-600">{errors.stopBits.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="parity" className="form-label">Parity *</label>
            <Controller
              name="parity"
              control={control}
              rules={{ required: "Parity is required" }}
              defaultValue="none"
              render={({ field }) => (
                <select {...field} id="parity" className={`form-select ${errors.parity ? 'border-red-500' : ''}`}>
                  <option value="none">None</option>
                  <option value="even">Even</option>
                  <option value="odd">Odd</option>
                  <option value="mark">Mark</option>
                  <option value="space">Space</option>
                </select>
              )}
            />
            {errors.parity && <p className="mt-1 text-sm text-red-600">{errors.parity.message}</p>}
          </div>
          
          <div className="form-group md:col-span-2">
            <label htmlFor="serialPath" className="form-label">Serial Port Path *</label>
            <Controller
              name="serialPath"
              control={control}
              rules={{ required: "Serial port path is required" }}
              defaultValue="/dev/ttyAMA0"
              render={({ field }) => (
                <input 
                  {...field} 
                  type="text" 
                  id="serialPath" 
                  className={`form-input ${errors.serialPath ? 'border-red-500' : ''}`} 
                  placeholder="/dev/ttyAMA0"
                />
              )}
            />
            {errors.serialPath && <p className="mt-1 text-sm text-red-600">{errors.serialPath.message}</p>}
            <p className="text-sm text-gray-500 mt-1">Example: /dev/ttyAMA0, /dev/ttyUSB0</p>
          </div>
        </div>
      );
      
    case 'SPI':
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="form-group">
            <label htmlFor="spiMode" className="form-label">SPI Mode *</label>
            <Controller
              name="spiMode"
              control={control}
              rules={{ required: "SPI mode is required" }}
              defaultValue={0}
              render={({ field }) => (
                <select {...field} id="spiMode" className={`form-select ${errors.spiMode ? 'border-red-500' : ''}`}>
                  <option value="0">Mode 0 (CPOL=0, CPHA=0)</option>
                  <option value="1">Mode 1 (CPOL=0, CPHA=1)</option>
                  <option value="2">Mode 2 (CPOL=1, CPHA=0)</option>
                  <option value="3">Mode 3 (CPOL=1, CPHA=1)</option>
                </select>
              )}
            />
            {errors.spiMode && <p className="mt-1 text-sm text-red-600">{errors.spiMode.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="spiSpeed" className="form-label">SPI Speed (Hz) *</label>
            <Controller
              name="spiSpeed"
              control={control}
              rules={{ required: "SPI speed is required" }}
              defaultValue={1000000}
              render={({ field }) => (
                <input 
                  {...field} 
                  type="number" 
                  id="spiSpeed" 
                  className={`form-input ${errors.spiSpeed ? 'border-red-500' : ''}`} 
                  placeholder="1000000"
                />
              )}
            />
            {errors.spiSpeed && <p className="mt-1 text-sm text-red-600">{errors.spiSpeed.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="spiBus" className="form-label">SPI Bus *</label>
            <Controller
              name="spiBus"
              control={control}
              rules={{ required: "SPI bus is required" }}
              defaultValue={0}
              render={({ field }) => (
                <input 
                  {...field} 
                  type="number" 
                  id="spiBus" 
                  className={`form-input ${errors.spiBus ? 'border-red-500' : ''}`} 
                  placeholder="0"
                  min="0"
                />
              )}
            />
            {errors.spiBus && <p className="mt-1 text-sm text-red-600">{errors.spiBus.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="spiChipSelect" className="form-label">Chip Select (CS) *</label>
            <Controller
              name="spiChipSelect"
              control={control}
              rules={{ required: "Chip select is required" }}
              defaultValue={0}
              render={({ field }) => (
                <input 
                  {...field} 
                  type="number" 
                  id="spiChipSelect" 
                  className={`form-input ${errors.spiChipSelect ? 'border-red-500' : ''}`} 
                  placeholder="0"
                  min="0"
                />
              )}
            />
            {errors.spiChipSelect && <p className="mt-1 text-sm text-red-600">{errors.spiChipSelect.message}</p>}
          </div>
        </div>
      );
      
    case 'I2C':
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="form-group">
            <label htmlFor="i2cBus" className="form-label">I2C Bus *</label>
            <Controller
              name="i2cBus"
              control={control}
              rules={{ required: "I2C bus is required" }}
              defaultValue={1}
              render={({ field }) => (
                <input 
                  {...field} 
                  type="number" 
                  id="i2cBus" 
                  className={`form-input ${errors.i2cBus ? 'border-red-500' : ''}`} 
                  placeholder="1"
                  min="0"
                />
              )}
            />
            {errors.i2cBus && <p className="mt-1 text-sm text-red-600">{errors.i2cBus.message}</p>}
            <p className="text-sm text-gray-500 mt-1">Bus 1 is typically used on Raspberry Pi</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="i2cAddress" className="form-label">I2C Address (hex) *</label>
            <Controller
              name="i2cAddress"
              control={control}
              rules={{ 
                required: "I2C address is required",
                pattern: {
                  value: /^(0x)?[0-9A-Fa-f]{1,2}$/,
                  message: "Invalid hex address"
                } 
              }}
              defaultValue="0x76"
              render={({ field }) => (
                <input 
                  {...field} 
                  type="text" 
                  id="i2cAddress" 
                  className={`form-input ${errors.i2cAddress ? 'border-red-500' : ''}`} 
                  placeholder="0x76"
                />
              )}
            />
            {errors.i2cAddress && <p className="mt-1 text-sm text-red-600">{errors.i2cAddress.message}</p>}
          </div>
        </div>
      );
      
    case '1-Wire':
      return (
        <div className="form-group">
          <label htmlFor="oneWireId" className="form-label">Device ID *</label>
          <Controller
            name="oneWireId"
            control={control}
            rules={{ required: "Device ID is required" }}
            defaultValue=""
            render={({ field }) => (
              <input 
                {...field} 
                type="text" 
                id="oneWireId" 
                className={`form-input ${errors.oneWireId ? 'border-red-500' : ''}`} 
                placeholder="28-000000000000"
              />
            )}
          />
          {errors.oneWireId && <p className="mt-1 text-sm text-red-600">{errors.oneWireId.message}</p>}
          <p className="text-sm text-gray-500 mt-1">For DS18B20 temperature sensors: 28-XXXXXXXXXXXX</p>
        </div>
      );
      
    case 'CAN':
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="form-group">
            <label htmlFor="canInterface" className="form-label">CAN Interface *</label>
            <Controller
              name="canInterface"
              control={control}
              rules={{ required: "CAN interface is required" }}
              defaultValue="can0"
              render={({ field }) => (
                <input 
                  {...field} 
                  type="text" 
                  id="canInterface" 
                  className={`form-input ${errors.canInterface ? 'border-red-500' : ''}`} 
                  placeholder="can0"
                />
              )}
            />
            {errors.canInterface && <p className="mt-1 text-sm text-red-600">{errors.canInterface.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="canBitrate" className="form-label">Bitrate *</label>
            <Controller
              name="canBitrate"
              control={control}
              rules={{ required: "Bitrate is required" }}
              defaultValue={125000}
              render={({ field }) => (
                <select {...field} id="canBitrate" className={`form-select ${errors.canBitrate ? 'border-red-500' : ''}`}>
                  <option value="125000">125 kbit/s</option>
                  <option value="250000">250 kbit/s</option>
                  <option value="500000">500 kbit/s</option>
                  <option value="1000000">1 Mbit/s</option>
                </select>
              )}
            />
            {errors.canBitrate && <p className="mt-1 text-sm text-red-600">{errors.canBitrate.message}</p>}
          </div>
        </div>
      );
      
    default:
      return (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md">
          <p>Please specify configuration fields for {protocol} protocol.</p>
        </div>
      );
  }
};

export default ProtocolFields;