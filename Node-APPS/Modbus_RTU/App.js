const { SerialPort } = require('serialport');
const crc = require('crc');
const readline = require('readline');
const pigpio = require('pigpio');
const Gpio = pigpio.Gpio;

// Configuration
const SERIAL_PORT = '/dev/ttyAMA0';  // UART port on RPi
const BAUD_RATE = 9600;              // Standard baud rate
const SLAVE_ID = 3;                  // ESP32 Modbus slave ID

// RS485 control
const RS485_CONTROL_PIN = 21;        // DE/RE pin for RS485 module
const RS485_TX_PIN_VALUE = 1;        // HIGH for transmit
const RS485_RX_PIN_VALUE = 0;        // LOW for receive

// Modbus function codes
const FUNC_READ_COILS = 0x01;
const FUNC_READ_DISCRETE = 0x02;
const FUNC_READ_HOLDING = 0x03;
const FUNC_READ_INPUT = 0x04;
const FUNC_WRITE_COIL = 0x05;
const FUNC_WRITE_HOLDING = 0x06;
const FUNC_WRITE_MULTIPLE_COILS = 0x0F;
const FUNC_WRITE_MULTIPLE_REGS = 0x10;

// Initialize pigpio and create GPIO instance for RS485 direction control
let directionPin;
try {
  // Initialize pigpio
  pigpio.initialize();
  console.log('PiGPIO initialized successfully');
  
  // Setup direction pin
  directionPin = new Gpio(RS485_CONTROL_PIN, {mode: Gpio.OUTPUT});
  console.log(`Direction control GPIO ${RS485_CONTROL_PIN} initialized`);
} catch (error) {
  console.warn('Failed to initialize GPIO:', error.message);
  console.log('Continuing with simulated GPIO');
  
  // Create a mock GPIO object if real GPIO fails
  directionPin = {
    digitalWrite: (value) => console.log(`[SIMULATED] Setting RS485 direction to ${value ? 'TRANSMIT' : 'RECEIVE'}`),
    mode: () => {}
  };
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Create serial port instance
const port = new SerialPort({
  path: SERIAL_PORT,
  baudRate: BAUD_RATE,
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
});

// Calculate Modbus CRC16
function calculateCRC(buffer) {
  return crc.crc16modbus(buffer);
}

// Convert CRC to buffer (little endian)
function crcToBuffer(crc) {
  const buffer = Buffer.alloc(2);
  buffer[0] = crc & 0xFF;          // Low byte
  buffer[1] = (crc >> 8) & 0xFF;   // High byte
  return buffer;
}

// Function to delay milliseconds
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Print buffer in hex format
function printHexBuffer(buffer) {
  let hexString = 'HEX: ';
  for (let i = 0; i < buffer.length; i++) {
    hexString += buffer[i].toString(16).padStart(2, '0').toUpperCase() + ' ';
  }
  console.log(hexString);
}

// Set RS485 direction
function setRS485Direction(direction) {
  try {
    directionPin.digitalWrite(direction);
  } catch (error) {
    console.warn(`Error setting direction: ${error.message}`);
  }
}

// Function to send a Modbus command and get response
async function sendModbusCommand(cmdBuffer) {
  return new Promise((resolve, reject) => {
    // Log command being sent
    console.log('Sending Modbus command:');
    printHexBuffer(cmdBuffer);
    
    // Prepare for response
    let responseData = Buffer.alloc(0);
    let responseTimeout;
    
    // Response handler
    const dataHandler = (data) => {
      responseData = Buffer.concat([responseData, data]);
      
      // If we have enough data to determine the expected length
      if (responseData.length >= 3) {
        let expectedLength;
        
        // Determine expected length based on function code
        const functionCode = responseData[1];
        
        // Check if it's an exception response
        if ((functionCode & 0x80) !== 0) {
          expectedLength = 5; // Exception responses are 5 bytes
        } else {
          switch (functionCode) {
            case FUNC_READ_COILS:
            case FUNC_READ_DISCRETE:
            case FUNC_READ_HOLDING:
            case FUNC_READ_INPUT:
              // These responses have a byte count field at index 2
              if (responseData.length >= 3) {
                expectedLength = responseData[2] + 5; // Header(3) + byte count field value + CRC(2)
              }
              break;
            case FUNC_WRITE_COIL:
            case FUNC_WRITE_HOLDING:
              expectedLength = 8; // Fixed length for single write responses
              break;
            case FUNC_WRITE_MULTIPLE_COILS:
            case FUNC_WRITE_MULTIPLE_REGS:
              expectedLength = 8; // Fixed length for multiple write responses
              break;
            default:
              // Unknown function code, wait for more data or timeout
              break;
          }
        }
        
        // If we know the expected length and have received enough data
        if (expectedLength && responseData.length >= expectedLength) {
          clearTimeout(responseTimeout);
          port.removeListener('data', dataHandler);
          resolve(responseData);
        }
      }
    };
    
    // Set timeout for response
    responseTimeout = setTimeout(() => {
      port.removeListener('data', dataHandler);
      reject(new Error('Response timeout'));
    }, 2000);
    
    // Set up the data listener
    port.on('data', dataHandler);
    
    // Clear input buffer
    port.flush();
    
    // Set to transmit mode
    setRS485Direction(RS485_TX_PIN_VALUE);
    
    // Small delay after switching to transmit
    setTimeout(() => {
      // Send the command
      port.write(cmdBuffer, async (err) => {
        if (err) {
          clearTimeout(responseTimeout);
          port.removeListener('data', dataHandler);
          setRS485Direction(RS485_RX_PIN_VALUE);
          reject(err);
          return;
        }
        
        // Wait for transmission to complete
        port.drain(async () => {
          // Wait a bit to ensure command is sent
          await delay(100);
          
          // Switch back to receive mode
          setRS485Direction(RS485_RX_PIN_VALUE);
          
          // Small delay after switching to receive
          await delay(20);
        });
      });
    }, 20);
  });
}

// Create Read Coils command (Function 0x01)
function createReadCoilsCmd(address, quantity) {
  const buffer = Buffer.alloc(6);
  buffer[0] = SLAVE_ID;
  buffer[1] = FUNC_READ_COILS;
  buffer[2] = (address >> 8) & 0xFF;  // Address High byte
  buffer[3] = address & 0xFF;         // Address Low byte
  buffer[4] = (quantity >> 8) & 0xFF; // Quantity High byte
  buffer[5] = quantity & 0xFF;        // Quantity Low byte
  
  const crc = calculateCRC(buffer);
  const crcBuffer = crcToBuffer(crc);
  
  return Buffer.concat([buffer, crcBuffer]);
}

// Create Read Discrete Inputs command (Function 0x02)
function createReadDiscreteInputsCmd(address, quantity) {
  const buffer = Buffer.alloc(6);
  buffer[0] = SLAVE_ID;
  buffer[1] = FUNC_READ_DISCRETE;
  buffer[2] = (address >> 8) & 0xFF;  // Address High byte
  buffer[3] = address & 0xFF;         // Address Low byte
  buffer[4] = (quantity >> 8) & 0xFF; // Quantity High byte
  buffer[5] = quantity & 0xFF;        // Quantity Low byte
  
  const crc = calculateCRC(buffer);
  const crcBuffer = crcToBuffer(crc);
  
  return Buffer.concat([buffer, crcBuffer]);
}

// Create Read Holding Registers command (Function 0x03)
function createReadHoldingRegistersCmd(address, quantity) {
  const buffer = Buffer.alloc(6);
  buffer[0] = SLAVE_ID;
  buffer[1] = FUNC_READ_HOLDING;
  buffer[2] = (address >> 8) & 0xFF;  // Address High byte
  buffer[3] = address & 0xFF;         // Address Low byte
  buffer[4] = (quantity >> 8) & 0xFF; // Quantity High byte
  buffer[5] = quantity & 0xFF;        // Quantity Low byte
  
  const crc = calculateCRC(buffer);
  const crcBuffer = crcToBuffer(crc);
  
  return Buffer.concat([buffer, crcBuffer]);
}

// Create Read Input Registers command (Function 0x04)
function createReadInputRegistersCmd(address, quantity) {
  const buffer = Buffer.alloc(6);
  buffer[0] = SLAVE_ID;
  buffer[1] = FUNC_READ_INPUT;
  buffer[2] = (address >> 8) & 0xFF;  // Address High byte
  buffer[3] = address & 0xFF;         // Address Low byte
  buffer[4] = (quantity >> 8) & 0xFF; // Quantity High byte
  buffer[5] = quantity & 0xFF;        // Quantity Low byte
  
  const crc = calculateCRC(buffer);
  const crcBuffer = crcToBuffer(crc);
  
  return Buffer.concat([buffer, crcBuffer]);
}

// Create Write Single Coil command (Function 0x05)
function createWriteCoilCmd(address, value) {
  const buffer = Buffer.alloc(6);
  buffer[0] = SLAVE_ID;
  buffer[1] = FUNC_WRITE_COIL;
  buffer[2] = (address >> 8) & 0xFF;  // Address High byte
  buffer[3] = address & 0xFF;         // Address Low byte
  
  // Coil value: 0xFF00 for ON, 0x0000 for OFF
  if (value) {
    buffer[4] = 0xFF;  // Value High byte (ON)
    buffer[5] = 0x00;  // Value Low byte (ON)
  } else {
    buffer[4] = 0x00;  // Value High byte (OFF)
    buffer[5] = 0x00;  // Value Low byte (OFF)
  }
  
  const crc = calculateCRC(buffer);
  const crcBuffer = crcToBuffer(crc);
  
  return Buffer.concat([buffer, crcBuffer]);
}

// Create Write Single Register command (Function 0x06)
function createWriteRegisterCmd(address, value) {
  const buffer = Buffer.alloc(6);
  buffer[0] = SLAVE_ID;
  buffer[1] = FUNC_WRITE_HOLDING;
  buffer[2] = (address >> 8) & 0xFF;  // Address High byte
  buffer[3] = address & 0xFF;         // Address Low byte
  buffer[4] = (value >> 8) & 0xFF;    // Value High byte
  buffer[5] = value & 0xFF;           // Value Low byte
  
  const crc = calculateCRC(buffer);
  const crcBuffer = crcToBuffer(crc);
  
  return Buffer.concat([buffer, crcBuffer]);
}

// Create Write Multiple Coils command (Function 0x0F)
function createWriteMultipleCoilsCmd(address, values) {
  const quantity = values.length;
  const byteCount = Math.ceil(quantity / 8);
  
  const buffer = Buffer.alloc(7 + byteCount);
  buffer[0] = SLAVE_ID;
  buffer[1] = FUNC_WRITE_MULTIPLE_COILS;
  buffer[2] = (address >> 8) & 0xFF;      // Address High byte
  buffer[3] = address & 0xFF;             // Address Low byte
  buffer[4] = (quantity >> 8) & 0xFF;     // Quantity High byte
  buffer[5] = quantity & 0xFF;            // Quantity Low byte
  buffer[6] = byteCount;                  // Byte count
  
  // Pack the coil values into bytes
  for (let i = 0; i < byteCount; i++) {
    buffer[7 + i] = 0;
    for (let j = 0; j < 8; j++) {
      const bitIndex = i * 8 + j;
      if (bitIndex < quantity && values[bitIndex]) {
        buffer[7 + i] |= (1 << j);
      }
    }
  }
  
  const crc = calculateCRC(buffer);
  const crcBuffer = crcToBuffer(crc);
  
  return Buffer.concat([buffer, crcBuffer]);
}

// Create Write Multiple Registers command (Function 0x10)
function createWriteMultipleRegistersCmd(address, values) {
  const quantity = values.length;
  const byteCount = quantity * 2;
  
  const buffer = Buffer.alloc(7 + byteCount);
  buffer[0] = SLAVE_ID;
  buffer[1] = FUNC_WRITE_MULTIPLE_REGS;
  buffer[2] = (address >> 8) & 0xFF;      // Address High byte
  buffer[3] = address & 0xFF;             // Address Low byte
  buffer[4] = (quantity >> 8) & 0xFF;     // Quantity High byte
  buffer[5] = quantity & 0xFF;            // Quantity Low byte
  buffer[6] = byteCount;                  // Byte count
  
  // Pack the register values into bytes
  for (let i = 0; i < quantity; i++) {
    buffer[7 + i * 2] = (values[i] >> 8) & 0xFF;     // Value High byte
    buffer[7 + i * 2 + 1] = values[i] & 0xFF;        // Value Low byte
  }
  
  const crc = calculateCRC(buffer);
  const crcBuffer = crcToBuffer(crc);
  
  return Buffer.concat([buffer, crcBuffer]);
}

// Parse Read Coils or Read Discrete Inputs response
function parseReadBitsResponse(buffer, functionCode) {
  const type = (functionCode === FUNC_READ_COILS) ? "Coil" : "Discrete Input";
  
  // Verify it's a proper response
  if (buffer.length < 3 || buffer[0] !== SLAVE_ID || buffer[1] !== functionCode) {
    console.log(`Invalid ${type} response`);
    return null;
  }
  
  // Get the byte count
  const byteCount = buffer[2];
  
  // Verify response length
  if (buffer.length < 3 + byteCount + 2) {
    console.log("Response too short");
    return null;
  }
  
  // Parse the bits
  console.log(`${type} values:`);
  const results = [];
  
  for (let i = 0; i < byteCount; i++) {
    const dataByte = buffer[3 + i];
    for (let j = 0; j < 8; j++) {
      const bitIndex = i * 8 + j;
      const bitValue = (dataByte >> j) & 0x01;
      console.log(`${type} ${bitIndex}: ${bitValue ? "ON" : "OFF"}`);
      results.push(bitValue === 1);
    }
  }
  
  return results;
}

// Parse Read Holding Registers or Read Input Registers response
function parseReadRegistersResponse(buffer, functionCode) {
  const type = (functionCode === FUNC_READ_HOLDING) ? "Holding Register" : "Input Register";
  
  // Verify it's a proper response
  if (buffer.length < 3 || buffer[0] !== SLAVE_ID || buffer[1] !== functionCode) {
    console.log(`Invalid ${type} response`);
    return null;
  }
  
  // Get the byte count
  const byteCount = buffer[2];
  
  // Verify response length
  if (buffer.length < 3 + byteCount + 2) {
    console.log("Response too short");
    return null;
  }
  
  // Parse the registers
  console.log(`${type} values:`);
  const results = [];
  
  for (let i = 0; i < byteCount / 2; i++) {
    const regValue = (buffer[3 + i * 2] << 8) | buffer[3 + i * 2 + 1];
    console.log(`${type} ${i}: ${regValue} (0x${regValue.toString(16).toUpperCase().padStart(4, '0')})`);
    results.push(regValue);
  }
  
  return results;
}

// Verify write response
function verifyWriteResponse(buffer, functionCode, address, expectedValue) {
  // For single write functions (0x05, 0x06)
  if (functionCode === FUNC_WRITE_COIL || functionCode === FUNC_WRITE_HOLDING) {
    // Verify it's a proper response
    if (buffer.length < 8 || buffer[0] !== SLAVE_ID || buffer[1] !== functionCode) {
      console.log("Invalid write response");
      return false;
    }
    
    // Verify address
    const respAddress = (buffer[2] << 8) | buffer[3];
    if (respAddress !== address) {
      console.log("Response address doesn't match request");
      return false;
    }
    
    // Verify value
    const respValue = (buffer[4] << 8) | buffer[5];
    if (respValue !== expectedValue) {
      console.log("Response value doesn't match request");
      return false;
    }
    
    return true;
  } 
  // For multiple write functions (0x0F, 0x10)
  else if (functionCode === FUNC_WRITE_MULTIPLE_COILS || functionCode === FUNC_WRITE_MULTIPLE_REGS) {
    // Verify it's a proper response
    if (buffer.length < 8 || buffer[0] !== SLAVE_ID || buffer[1] !== functionCode) {
      console.log("Invalid write response");
      return false;
    }
    
    // Verify address
    const respAddress = (buffer[2] << 8) | buffer[3];
    if (respAddress !== address) {
      console.log("Response address doesn't match request");
      return false;
    }
    
    // For multiple writes, we don't verify the quantity here
    return true;
  }
  
  return false;
}

// Check if response is an exception
function isExceptionResponse(buffer) {
  if (buffer.length >= 5 && buffer[0] === SLAVE_ID && (buffer[1] & 0x80)) {
    console.log(`Received exception response, code: 0x${buffer[2].toString(16).padStart(2, '0')}`);
    console.log("Exception meaning: ");
    switch (buffer[2]) {
      case 0x01: console.log("Illegal function"); break;
      case 0x02: console.log("Illegal data address"); break;
      case 0x03: console.log("Illegal data value"); break;
      case 0x04: console.log("Slave device failure"); break;
      default: console.log("Unknown exception"); break;
    }
    return true;
  }
  return false;
}

// Display the main menu
function displayMenu() {
  console.log("\n=== Modbus RTU Test Client ===");
  console.log("1. Read Coils (0x01)");
  console.log("2. Read Discrete Inputs (0x02)");
  console.log("3. Read Holding Registers (0x03)");
  console.log("4. Read Input Registers (0x04)");
  console.log("5. Write Single Coil (0x05)");
  console.log("6. Write Single Register (0x06)");
  console.log("7. Write Multiple Coils (0x0F)");
  console.log("8. Write Multiple Registers (0x10)");
  console.log("9. Toggle LED (Coil 0)");
  console.log("0. Exit");
  
  rl.question("Enter your choice: ", (choice) => {
    handleMenuChoice(parseInt(choice, 10));
  });
}

// Read user input for address and quantity
async function promptForAddressAndQuantity() {
  return new Promise((resolve) => {
    rl.question("Enter starting address: ", (addressInput) => {
      const address = parseInt(addressInput, 10);
      
      rl.question("Enter quantity to read (1-32): ", (quantityInput) => {
        const quantity = parseInt(quantityInput, 10);
        
        if (quantity < 1 || quantity > 32) {
          console.log("Invalid quantity. Must be between 1 and 32.");
          resolve(null);
        } else {
          resolve({ address, quantity });
        }
      });
    });
  });
}

// Read user input for coil address and value
async function promptForCoilWrite() {
  return new Promise((resolve) => {
    rl.question("Enter coil address: ", (addressInput) => {
      const address = parseInt(addressInput, 10);
      
      rl.question("Enter value (0=OFF, 1=ON): ", (valueInput) => {
        const value = parseInt(valueInput, 10) !== 0;
        resolve({ address, value });
      });
    });
  });
}

// Read user input for register address and value
async function promptForRegisterWrite() {
  return new Promise((resolve) => {
    rl.question("Enter register address: ", (addressInput) => {
      const address = parseInt(addressInput, 10);
      
      rl.question("Enter value (0-65535): ", (valueInput) => {
        const value = parseInt(valueInput, 10);
        resolve({ address, value });
      });
    });
  });
}

// Read user input for multiple coil values
async function promptForMultipleCoils() {
  return new Promise((resolve) => {
    rl.question("Enter starting address: ", (addressInput) => {
      const address = parseInt(addressInput, 10);
      
      rl.question("Enter quantity to write (1-32): ", (quantityInput) => {
        const quantity = parseInt(quantityInput, 10);
        
        if (quantity < 1 || quantity > 32) {
          console.log("Invalid quantity. Must be between 1 and 32.");
          resolve(null);
        } else {
          console.log("Enter values for each coil (0=OFF, 1=ON):");
          const values = [];
          
          function promptForCoilValue(index) {
            if (index >= quantity) {
              resolve({ address, values });
              return;
            }
            
            rl.question(`Coil ${address + index}: `, (valueInput) => {
              const value = parseInt(valueInput, 10) !== 0;
              values.push(value);
              promptForCoilValue(index + 1);
            });
          }
          
          promptForCoilValue(0);
        }
      });
    });
  });
}

// Read user input for multiple register values
async function promptForMultipleRegisters() {
  return new Promise((resolve) => {
    rl.question("Enter starting address: ", (addressInput) => {
      const address = parseInt(addressInput, 10);
      
      rl.question("Enter quantity to write (1-32): ", (quantityInput) => {
        const quantity = parseInt(quantityInput, 10);
        
        if (quantity < 1 || quantity > 32) {
          console.log("Invalid quantity. Must be between 1 and 32.");
          resolve(null);
        } else {
          console.log("Enter values for each register (0-65535):");
          const values = [];
          
          function promptForRegisterValue(index) {
            if (index >= quantity) {
              resolve({ address, values });
              return;
            }
            
            rl.question(`Register ${address + index}: `, (valueInput) => {
              const value = parseInt(valueInput, 10);
              values.push(value);
              promptForRegisterValue(index + 1);
            });
          }
          
          promptForRegisterValue(0);
        }
      });
    });
  });
}

// Handle menu choices
async function handleMenuChoice(choice) {
  try {
    let cmd, response, params;
    
    switch (choice) {
      case 1: // Read Coils
        params = await promptForAddressAndQuantity();
        if (!params) {
          displayMenu();
          return;
        }
        
        cmd = createReadCoilsCmd(params.address, params.quantity);
        response = await sendModbusCommand(cmd);
        
        console.log("Received response:");
        printHexBuffer(response);
        
        if (!isExceptionResponse(response)) {
          parseReadBitsResponse(response, FUNC_READ_COILS);
        }
        break;
        
      case 2: // Read Discrete Inputs
        params = await promptForAddressAndQuantity();
        if (!params) {
          displayMenu();
          return;
        }
        
        cmd = createReadDiscreteInputsCmd(params.address, params.quantity);
        response = await sendModbusCommand(cmd);
        
        console.log("Received response:");
        printHexBuffer(response);
        
        if (!isExceptionResponse(response)) {
          parseReadBitsResponse(response, FUNC_READ_DISCRETE);
        }
        break;
        
      case 3: // Read Holding Registers
        params = await promptForAddressAndQuantity();
        if (!params) {
          displayMenu();
          return;
        }
        
        cmd = createReadHoldingRegistersCmd(params.address, params.quantity);
        response = await sendModbusCommand(cmd);
        
        console.log("Received response:");
        printHexBuffer(response);
        
        if (!isExceptionResponse(response)) {
          parseReadRegistersResponse(response, FUNC_READ_HOLDING);
        }
        break;
        
      case 4: // Read Input Registers
        params = await promptForAddressAndQuantity();
        if (!params) {
          displayMenu();
          return;
        }
        
        cmd = createReadInputRegistersCmd(params.address, params.quantity);
        response = await sendModbusCommand(cmd);
        
        console.log("Received response:");
        printHexBuffer(response);
        
        if (!isExceptionResponse(response)) {
          parseReadRegistersResponse(response, FUNC_READ_INPUT);
        }
        break;
        
      case 5: // Write Single Coil
        params = await promptForCoilWrite();
        
        cmd = createWriteCoilCmd(params.address, params.value);
        response = await sendModbusCommand(cmd);
        
        console.log("Received response:");
        printHexBuffer(response);
        
        if (!isExceptionResponse(response)) {
          const expectedValue = params.value ? 0xFF00 : 0x0000;
          if (verifyWriteResponse(response, FUNC_WRITE_COIL, params.address, expectedValue)) {
            console.log(`Coil ${params.address} successfully set to ${params.value ? "ON" : "OFF"}`);
          }
        }
        break;
        
      case 6: // Write Single Register
        params = await promptForRegisterWrite();
        
        cmd = createWriteRegisterCmd(params.address, params.value);
        response = await sendModbusCommand(cmd);
        
        console.log("Received response:");
        printHexBuffer(response);
        
        if (!isExceptionResponse(response)) {
          if (verifyWriteResponse(response, FUNC_WRITE_HOLDING, params.address, params.value)) {
            console.log(`Register ${params.address} successfully set to ${params.value} (0x${params.value.toString(16).toUpperCase().padStart(4, '0')})`);
          }
        }
        break;
        
      case 7: // Write Multiple Coils
        params = await promptForMultipleCoils();
        if (!params) {
          displayMenu();
          return;
        }
        
        cmd = createWriteMultipleCoilsCmd(params.address, params.values);
        response = await sendModbusCommand(cmd);
        
        console.log("Received response:");
        printHexBuffer(response);
        
        if (!isExceptionResponse(response)) {
          if (verifyWriteResponse(response, FUNC_WRITE_MULTIPLE_COILS, params.address, 0)) {
            console.log(`Coils ${params.address}-${params.address + params.values.length - 1} successfully written`);
          }
        }
        break;
        
      case 8: // Write Multiple Registers
        params = await promptForMultipleRegisters();
        if (!params) {
          displayMenu();
          return;
        }
        
        cmd = createWriteMultipleRegistersCmd(params.address, params.values);
        response = await sendModbusCommand(cmd);
        
        console.log("Received response:");
        printHexBuffer(response);
        
        if (!isExceptionResponse(response)) {
          if (verifyWriteResponse(response, FUNC_WRITE_MULTIPLE_REGS, params.address, 0)) {
            console.log(`Registers ${params.address}-${params.address + params.values.length - 1} successfully written`);
          }
        }
        break;
        
      case 9: // Toggle LED (Coil 0)
        // Read current state first
        cmd = createReadCoilsCmd(0, 1);
        response = await sendModbusCommand(cmd);
        
        console.log("Current LED state:");
        printHexBuffer(response);
        
        if (!isExceptionResponse(response)) {
          const currentState = response.length >= 5 && response[1] === FUNC_READ_COILS && 
                              response[2] >= 1 && (response[3] & 0x01) !== 0;
          
          console.log(`Current LED state: ${currentState ? "ON" : "OFF"}`);
          
          // Toggle the state
          const newState = !currentState;
          console.log(`Toggling LED to: ${newState ? "ON" : "OFF"}`);
          
          cmd = createWriteCoilCmd(0, newState);
          response = await sendModbusCommand(cmd);
          
          console.log("Toggle response:");
          printHexBuffer(response);
          
          if (!isExceptionResponse(response)) {
            const expectedValue = newState ? 0xFF00 : 0x0000;
            if (verifyWriteResponse(response, FUNC_WRITE_COIL, 0, expectedValue)) {
              console.log(`LED successfully toggled to ${newState ? "ON" : "OFF"}`);
            }
          }
        }
        break;
        
      case 0: // Exit
        console.log('Exiting...');
        // Clean up resources
        if (directionPin && typeof directionPin.mode === 'function') {
          setRS485Direction(RS485_RX_PIN_VALUE); // Set back to receive mode
        }
        port.close(() => {
          try {
            if (pigpio.initialized) {
              pigpio.terminate();
            }
          } catch (error) {
            console.warn('Error terminating pigpio:', error.message);
          }
          rl.close();
          process.exit(0);
        });
        return;
        
      default:
        console.log('Invalid choice');
        displayMenu();
        return;
    }
    
    // Return to the menu after completing operation
    setTimeout(() => {
      displayMenu();
    }, 500);
  } catch (error) {
    console.error('Error:', error.message);
    setTimeout(() => {
      displayMenu();
    }, 500);
  }
}

// Handle port open event
port.on('open', () => {
  console.log(`Serial port ${SERIAL_PORT} opened at ${BAUD_RATE} baud`);
  
  // Set RS485 to receive mode initially
  setRS485Direction(RS485_RX_PIN_VALUE);
  console.log('RS485 set to receive mode');
  
  // Display the menu to start interaction
  displayMenu();
});

// Handle port errors
port.on('error', (err) => {
  console.error('Serial port error:', err.message);
  
  // Close readline interface
  rl.close();
  
  // Terminate pigpio
  try {
    if (pigpio.initialized) {
      pigpio.terminate();
    }
  } catch (error) {
    console.warn('Error terminating pigpio:', error.message);
  }
  
  process.exit(1);
});

// Handle ctrl+c and other termination signals
process.on('SIGINT', () => {
  console.log('\nClosing application...');
  
  // Set RS485 back to receive mode
  setRS485Direction(RS485_RX_PIN_VALUE);
  
  // Close serial port
  port.close();
  
  // Terminate pigpio
  try {
    if (pigpio.initialized) {
      pigpio.terminate();
    }
  } catch (error) {
    console.warn('Error terminating pigpio:', error.message);
  }
  
  // Close readline interface
  rl.close();
  
  process.exit(0);
});
