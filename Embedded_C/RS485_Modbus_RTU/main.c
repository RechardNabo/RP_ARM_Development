#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#include <stdbool.h>
#include <errno.h>
#include <time.h>
#include <pigpio.h>
#include <stdint.h>

// Configuration
#define SERIAL_PORT "/dev/ttyAMA0"  // UART port on RPi
#define BAUD_RATE B9600             // Standard baud rate
#define SLAVE_ID 3                  // ESP32 Modbus slave ID

// RS485 control
#define SERIAL_COMMUNICATION_CONTROL_PIN 21  // DE/RE pin for RS485 module
#define RS485_TX_PIN_VALUE 1                // HIGH for transmit
#define RS485_RX_PIN_VALUE 0                // LOW for receive

// Buffer size
#define MAX_BUFFER_SIZE 256

// Function codes
#define FUNC_READ_COILS           0x01
#define FUNC_READ_DISCRETE        0x02
#define FUNC_READ_HOLDING         0x03
#define FUNC_READ_INPUT           0x04
#define FUNC_WRITE_COIL           0x05
#define FUNC_WRITE_HOLDING        0x06
#define FUNC_WRITE_MULTIPLE_COILS 0x0F
#define FUNC_WRITE_MULTIPLE_REGS  0x10

// Function to delay milliseconds
void delay_ms(int milliseconds) {
    struct timespec ts;
    ts.tv_sec = milliseconds / 1000;
    ts.tv_nsec = (milliseconds % 1000) * 1000000;
    nanosleep(&ts, NULL);
}

// Function to read available data from serial port with timeout
int read_serial(int fd, unsigned char *buffer, int max_size, int timeout_ms) {
    int bytes_read = 0;
    int result;
    fd_set set;
    struct timeval timeout;
    
    // Set the specified timeout
    timeout.tv_sec = timeout_ms / 1000;
    timeout.tv_usec = (timeout_ms % 1000) * 1000;
    
    // Initialize the file descriptor set
    FD_ZERO(&set);
    FD_SET(fd, &set);
    
    // Check if there's data to read
    result = select(fd + 1, &set, NULL, NULL, &timeout);
    
    if (result > 0) {
        // Clear buffer first
        memset(buffer, 0, max_size);
        
        // Data is available, read it
        bytes_read = read(fd, buffer, max_size);
    }
    
    return bytes_read;
}

// Function to calculate Modbus CRC16
unsigned short calculateCRC(unsigned char *buffer, int length) {
    unsigned short crc = 0xFFFF;
    
    for (int i = 0; i < length; i++) {
        crc ^= buffer[i];
        for (int j = 0; j < 8; j++) {
            if ((crc & 0x0001) != 0) {
                crc >>= 1;
                crc ^= 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    
    return crc;
}

// Function to print buffer in hex format
void print_hex_buffer(const unsigned char *buffer, int length) {
    printf("HEX: ");
    for (int i = 0; i < length; i++) {
        printf("%02X ", buffer[i]);
    }
    printf("\n");
}

// Function to send a generic Modbus command
int send_modbus_command(int fd, int gpio_pin, unsigned char *cmd, int cmd_length) {
    // Set to transmit mode
    gpioWrite(gpio_pin, RS485_TX_PIN_VALUE);
    delay_ms(20);
    
    // Print the message we're sending
    printf("Sending Modbus command: ");
    print_hex_buffer(cmd, cmd_length);
    
    // Flush input buffer
    tcflush(fd, TCIFLUSH);
    
    // Send the command
    int bytes_written = write(fd, cmd, cmd_length);
    if (bytes_written != cmd_length) {
        printf("Error writing to serial port: %s\n", strerror(errno));
        gpioWrite(gpio_pin, RS485_RX_PIN_VALUE);
        return -1;
    }
    
    // Flush the output buffer
    tcdrain(fd);
    
    // Short delay to ensure message is sent
    delay_ms(100);
    
    // Switch back to receive mode
    gpioWrite(gpio_pin, RS485_RX_PIN_VALUE);
    delay_ms(20);
    
    return 0;
}

// Function to send a Read Coils command (Function 0x01)
int send_read_coils(int fd, int gpio_pin, uint16_t address, uint16_t quantity) {
    unsigned char modbus_cmd[8];
    
    modbus_cmd[0] = SLAVE_ID;           // Slave ID
    modbus_cmd[1] = FUNC_READ_COILS;    // Function code
    modbus_cmd[2] = (address >> 8) & 0xFF;  // Address High byte
    modbus_cmd[3] = address & 0xFF;         // Address Low byte
    modbus_cmd[4] = (quantity >> 8) & 0xFF; // Quantity High byte
    modbus_cmd[5] = quantity & 0xFF;        // Quantity Low byte
    
    // Calculate CRC
    unsigned short crc = calculateCRC(modbus_cmd, 6);
    modbus_cmd[6] = crc & 0xFF;         // CRC Low byte
    modbus_cmd[7] = (crc >> 8) & 0xFF;  // CRC High byte
    
    return send_modbus_command(fd, gpio_pin, modbus_cmd, 8);
}

// Function to send a Read Discrete Inputs command (Function 0x02)
int send_read_discrete_inputs(int fd, int gpio_pin, uint16_t address, uint16_t quantity) {
    unsigned char modbus_cmd[8];
    
    modbus_cmd[0] = SLAVE_ID;           // Slave ID
    modbus_cmd[1] = FUNC_READ_DISCRETE; // Function code
    modbus_cmd[2] = (address >> 8) & 0xFF;  // Address High byte
    modbus_cmd[3] = address & 0xFF;         // Address Low byte
    modbus_cmd[4] = (quantity >> 8) & 0xFF; // Quantity High byte
    modbus_cmd[5] = quantity & 0xFF;        // Quantity Low byte
    
    // Calculate CRC
    unsigned short crc = calculateCRC(modbus_cmd, 6);
    modbus_cmd[6] = crc & 0xFF;         // CRC Low byte
    modbus_cmd[7] = (crc >> 8) & 0xFF;  // CRC High byte
    
    return send_modbus_command(fd, gpio_pin, modbus_cmd, 8);
}

// Function to send a Read Holding Registers command (Function 0x03)
int send_read_holding_registers(int fd, int gpio_pin, uint16_t address, uint16_t quantity) {
    unsigned char modbus_cmd[8];
    
    modbus_cmd[0] = SLAVE_ID;           // Slave ID
    modbus_cmd[1] = FUNC_READ_HOLDING;  // Function code
    modbus_cmd[2] = (address >> 8) & 0xFF;  // Address High byte
    modbus_cmd[3] = address & 0xFF;         // Address Low byte
    modbus_cmd[4] = (quantity >> 8) & 0xFF; // Quantity High byte
    modbus_cmd[5] = quantity & 0xFF;        // Quantity Low byte
    
    // Calculate CRC
    unsigned short crc = calculateCRC(modbus_cmd, 6);
    modbus_cmd[6] = crc & 0xFF;         // CRC Low byte
    modbus_cmd[7] = (crc >> 8) & 0xFF;  // CRC High byte
    
    return send_modbus_command(fd, gpio_pin, modbus_cmd, 8);
}

// Function to send a Read Input Registers command (Function 0x04)
int send_read_input_registers(int fd, int gpio_pin, uint16_t address, uint16_t quantity) {
    unsigned char modbus_cmd[8];
    
    modbus_cmd[0] = SLAVE_ID;           // Slave ID
    modbus_cmd[1] = FUNC_READ_INPUT;    // Function code
    modbus_cmd[2] = (address >> 8) & 0xFF;  // Address High byte
    modbus_cmd[3] = address & 0xFF;         // Address Low byte
    modbus_cmd[4] = (quantity >> 8) & 0xFF; // Quantity High byte
    modbus_cmd[5] = quantity & 0xFF;        // Quantity Low byte
    
    // Calculate CRC
    unsigned short crc = calculateCRC(modbus_cmd, 6);
    modbus_cmd[6] = crc & 0xFF;         // CRC Low byte
    modbus_cmd[7] = (crc >> 8) & 0xFF;  // CRC High byte
    
    return send_modbus_command(fd, gpio_pin, modbus_cmd, 8);
}

// Function to send a Write Single Coil command (Function 0x05)
int send_write_coil(int fd, int gpio_pin, uint16_t address, bool value) {
    unsigned char modbus_cmd[8];
    
    modbus_cmd[0] = SLAVE_ID;           // Slave ID
    modbus_cmd[1] = FUNC_WRITE_COIL;    // Function code
    modbus_cmd[2] = (address >> 8) & 0xFF;  // Address High byte
    modbus_cmd[3] = address & 0xFF;         // Address Low byte
    
    // Coil value: 0xFF00 for ON, 0x0000 for OFF
    if (value) {
        modbus_cmd[4] = 0xFF;           // Value High byte (ON)
        modbus_cmd[5] = 0x00;           // Value Low byte (ON)
    } else {
        modbus_cmd[4] = 0x00;           // Value High byte (OFF)
        modbus_cmd[5] = 0x00;           // Value Low byte (OFF)
    }
    
    // Calculate CRC
    unsigned short crc = calculateCRC(modbus_cmd, 6);
    modbus_cmd[6] = crc & 0xFF;         // CRC Low byte
    modbus_cmd[7] = (crc >> 8) & 0xFF;  // CRC High byte
    
    return send_modbus_command(fd, gpio_pin, modbus_cmd, 8);
}

// Function to send a Write Single Register command (Function 0x06)
int send_write_register(int fd, int gpio_pin, uint16_t address, uint16_t value) {
    unsigned char modbus_cmd[8];
    
    modbus_cmd[0] = SLAVE_ID;           // Slave ID
    modbus_cmd[1] = FUNC_WRITE_HOLDING; // Function code
    modbus_cmd[2] = (address >> 8) & 0xFF;  // Address High byte
    modbus_cmd[3] = address & 0xFF;         // Address Low byte
    modbus_cmd[4] = (value >> 8) & 0xFF;    // Value High byte
    modbus_cmd[5] = value & 0xFF;           // Value Low byte
    
    // Calculate CRC
    unsigned short crc = calculateCRC(modbus_cmd, 6);
    modbus_cmd[6] = crc & 0xFF;         // CRC Low byte
    modbus_cmd[7] = (crc >> 8) & 0xFF;  // CRC High byte
    
    return send_modbus_command(fd, gpio_pin, modbus_cmd, 8);
}

// Function to send a Write Multiple Coils command (Function 0x0F)
int send_write_multiple_coils(int fd, int gpio_pin, uint16_t address, uint16_t quantity, bool *values) {
    // Calculate the number of bytes needed to hold the coil values
    uint8_t byteCount = (quantity + 7) / 8;
    
    // Total length: 7 bytes header + byteCount + 2 bytes CRC
    uint8_t totalLength = 9 + byteCount;
    unsigned char *modbus_cmd = (unsigned char *)malloc(totalLength);
    
    modbus_cmd[0] = SLAVE_ID;                   // Slave ID
    modbus_cmd[1] = FUNC_WRITE_MULTIPLE_COILS;  // Function code
    modbus_cmd[2] = (address >> 8) & 0xFF;      // Address High byte
    modbus_cmd[3] = address & 0xFF;             // Address Low byte
    modbus_cmd[4] = (quantity >> 8) & 0xFF;     // Quantity High byte
    modbus_cmd[5] = quantity & 0xFF;            // Quantity Low byte
    modbus_cmd[6] = byteCount;                  // Byte count
    
    // Pack the coil values into bytes
    for (int i = 0; i < byteCount; i++) {
        modbus_cmd[7 + i] = 0;
        for (int j = 0; j < 8; j++) {
            int bitIndex = i * 8 + j;
            if (bitIndex < quantity && values[bitIndex]) {
                modbus_cmd[7 + i] |= (1 << j);
            }
        }
    }
    
    // Calculate CRC
    unsigned short crc = calculateCRC(modbus_cmd, 7 + byteCount);
    modbus_cmd[7 + byteCount] = crc & 0xFF;         // CRC Low byte
    modbus_cmd[7 + byteCount + 1] = (crc >> 8) & 0xFF;  // CRC High byte
    
    int result = send_modbus_command(fd, gpio_pin, modbus_cmd, totalLength);
    
    free(modbus_cmd);
    return result;
}

// Function to send a Write Multiple Registers command (Function 0x10)
int send_write_multiple_registers(int fd, int gpio_pin, uint16_t address, uint16_t quantity, uint16_t *values) {
    // Calculate the number of bytes needed to hold the register values
    uint8_t byteCount = quantity * 2;
    
    // Total length: 7 bytes header + byteCount + 2 bytes CRC
    uint8_t totalLength = 9 + byteCount;
    unsigned char *modbus_cmd = (unsigned char *)malloc(totalLength);
    
    modbus_cmd[0] = SLAVE_ID;                   // Slave ID
    modbus_cmd[1] = FUNC_WRITE_MULTIPLE_REGS;   // Function code
    modbus_cmd[2] = (address >> 8) & 0xFF;      // Address High byte
    modbus_cmd[3] = address & 0xFF;             // Address Low byte
    modbus_cmd[4] = (quantity >> 8) & 0xFF;     // Quantity High byte
    modbus_cmd[5] = quantity & 0xFF;            // Quantity Low byte
    modbus_cmd[6] = byteCount;                  // Byte count
    
    // Pack the register values into bytes
    for (int i = 0; i < quantity; i++) {
        modbus_cmd[7 + i * 2] = (values[i] >> 8) & 0xFF;  // High byte
        modbus_cmd[7 + i * 2 + 1] = values[i] & 0xFF;     // Low byte
    }
    
    // Calculate CRC
    unsigned short crc = calculateCRC(modbus_cmd, 7 + byteCount);
    modbus_cmd[7 + byteCount] = crc & 0xFF;         // CRC Low byte
    modbus_cmd[7 + byteCount + 1] = (crc >> 8) & 0xFF;  // CRC High byte
    
    int result = send_modbus_command(fd, gpio_pin, modbus_cmd, totalLength);
    
    free(modbus_cmd);
    return result;
}

// Function to parse a Read Coils or Read Discrete Inputs response
void parse_read_bits_response(unsigned char *buffer, int length, uint8_t function_code) {
    const char *type = (function_code == FUNC_READ_COILS) ? "Coil" : "Discrete Input";
    
    // Verify it's a proper response
    if (length < 3 || buffer[0] != SLAVE_ID || buffer[1] != function_code) {
        printf("Invalid %s response\n", type);
        return;
    }
    
    // Get the byte count
    int byteCount = buffer[2];
    
    // Verify response length
    if (length < 3 + byteCount + 2) {
        printf("Response too short\n");
        return;
    }
    
    // Parse the bits
    printf("%s values:\n", type);
    for (int i = 0; i < byteCount; i++) {
        uint8_t dataByte = buffer[3 + i];
        for (int j = 0; j < 8; j++) {
            int bitIndex = i * 8 + j;
            bool bitValue = (dataByte >> j) & 0x01;
            printf("%s %d: %s\n", type, bitIndex, bitValue ? "ON" : "OFF");
        }
    }
}

// Function to parse a Read Holding Registers or Read Input Registers response
void parse_read_registers_response(unsigned char *buffer, int length, uint8_t function_code) {
    const char *type = (function_code == FUNC_READ_HOLDING) ? "Holding Register" : "Input Register";
    
    // Verify it's a proper response
    if (length < 3 || buffer[0] != SLAVE_ID || buffer[1] != function_code) {
        printf("Invalid %s response\n", type);
        return;
    }
    
    // Get the byte count
    int byteCount = buffer[2];
    
    // Verify response length
    if (length < 3 + byteCount + 2) {
        printf("Response too short\n");
        return;
    }
    
    // Parse the registers
    printf("%s values:\n", type);
    for (int i = 0; i < byteCount / 2; i++) {
        uint16_t regValue = (buffer[3 + i * 2] << 8) | buffer[3 + i * 2 + 1];
        printf("%s %d: %u (0x%04X)\n", type, i, regValue, regValue);
    }
}

// Function to verify a Write response
bool verify_write_response(unsigned char *buffer, int length, uint8_t function_code, uint16_t address, uint16_t expectedValue) {
    // For single write functions (0x05, 0x06)
    if (function_code == FUNC_WRITE_COIL || function_code == FUNC_WRITE_HOLDING) {
        // Verify it's a proper response
        if (length < 8 || buffer[0] != SLAVE_ID || buffer[1] != function_code) {
            printf("Invalid write response\n");
            return false;
        }
        
        // Verify address
        uint16_t respAddress = (buffer[2] << 8) | buffer[3];
        if (respAddress != address) {
            printf("Response address doesn't match request\n");
            return false;
        }
        
        // Verify value
        uint16_t respValue = (buffer[4] << 8) | buffer[5];
        if (respValue != expectedValue) {
            printf("Response value doesn't match request\n");
            return false;
        }
        
        return true;
    } 
    // For multiple write functions (0x0F, 0x10)
    else if (function_code == FUNC_WRITE_MULTIPLE_COILS || function_code == FUNC_WRITE_MULTIPLE_REGS) {
        // Verify it's a proper response
        if (length < 8 || buffer[0] != SLAVE_ID || buffer[1] != function_code) {
            printf("Invalid write response\n");
            return false;
        }
        
        // Verify address
        uint16_t respAddress = (buffer[2] << 8) | buffer[3];
        if (respAddress != address) {
            printf("Response address doesn't match request\n");
            return false;
        }
        
        // For multiple writes, we don't verify the quantity here
        return true;
    }
    
    return false;
}

// Function to check if a response is an exception
bool is_exception_response(unsigned char *buffer, int length) {
    if (length >= 5 && buffer[0] == SLAVE_ID && (buffer[1] & 0x80)) {
        printf("Received exception response, code: 0x%02X\n", buffer[2]);
        printf("Exception meaning: ");
        switch (buffer[2]) {
            case 0x01: printf("Illegal function\n"); break;
            case 0x02: printf("Illegal data address\n"); break;
            case 0x03: printf("Illegal data value\n"); break;
            case 0x04: printf("Slave device failure\n"); break;
            default: printf("Unknown exception\n"); break;
        }
        return true;
    }
    return false;
}

// Function to display the main menu
void display_menu() {
    printf("\n=== Modbus RTU Test Client ===\n");
    printf("1. Read Coils (0x01)\n");
    printf("2. Read Discrete Inputs (0x02)\n");
    printf("3. Read Holding Registers (0x03)\n");
    printf("4. Read Input Registers (0x04)\n");
    printf("5. Write Single Coil (0x05)\n");
    printf("6. Write Single Register (0x06)\n");
    printf("7. Write Multiple Coils (0x0F)\n");
    printf("8. Write Multiple Registers (0x10)\n");
    printf("9. Toggle LED (Coil 0)\n");
    printf("0. Exit\n");
    printf("Enter your choice: ");
}

int main() {
    int serial_fd;
    struct termios tty;
    unsigned char buffer[MAX_BUFFER_SIZE];
    int choice;
    
    // Initialize pigpio library
    if (gpioInitialise() < 0) {
        fprintf(stderr, "Failed to initialize pigpio\n");
        return 1;
    }
    
    printf("Modbus RTU Test Client Starting\n");
    
    // Set the control pin as output
    gpioSetMode(SERIAL_COMMUNICATION_CONTROL_PIN, PI_OUTPUT);
    gpioWrite(SERIAL_COMMUNICATION_CONTROL_PIN, RS485_RX_PIN_VALUE);
    
    // Open serial port
    serial_fd = open(SERIAL_PORT, O_RDWR | O_NOCTTY | O_NDELAY);
    if (serial_fd < 0) {
        fprintf(stderr, "Error opening %s: %s\n", SERIAL_PORT, strerror(errno));
        gpioTerminate();
        return 1;
    }
    
    // Get current serial port attributes
    memset(&tty, 0, sizeof(tty));
    if (tcgetattr(serial_fd, &tty) != 0) {
        fprintf(stderr, "Error from tcgetattr: %s\n", strerror(errno));
        close(serial_fd);
        gpioTerminate();
        return 1;
    }
    
    // Set baud rate
    cfsetospeed(&tty, BAUD_RATE);
    cfsetispeed(&tty, BAUD_RATE);
    
    // Set 8N1 (8 bits, no parity, 1 stop bit)
    tty.c_cflag &= ~PARENB;          // No parity
    tty.c_cflag &= ~CSTOPB;          // 1 stop bit
    tty.c_cflag &= ~CSIZE;
    tty.c_cflag |= CS8;              // 8 data bits
    tty.c_cflag &= ~CRTSCTS;         // No hardware flow control
    tty.c_cflag |= CREAD | CLOCAL;   // Enable receiver, ignore modem control lines
    
    // Set raw input mode, no echo
    tty.c_lflag &= ~(ICANON | ECHO | ECHOE | ISIG);
    
    // Set raw output mode
    tty.c_oflag &= ~OPOST;
    
    // Configure input processing
    tty.c_iflag &= ~(IXON | IXOFF | IXANY); // Disable software flow control
    tty.c_iflag &= ~(IGNBRK | BRKINT | PARMRK | ISTRIP | INLCR | IGNCR | ICRNL); // Disable special handling of received bytes
    
    // Set the attributes
    if (tcsetattr(serial_fd, TCSANOW, &tty) != 0) {
        fprintf(stderr, "Error from tcsetattr: %s\n", strerror(errno));
        close(serial_fd);
        gpioTerminate();
        return 1;
    }
    
    // Clear any existing data in the buffer
    tcflush(serial_fd, TCIOFLUSH);
    
    printf("Serial port configured successfully at 9600 baud\n");
    
    // Main loop
    while (1) {
        display_menu();
        scanf("%d", &choice);
        while (getchar() != '\n');  // Consume newline
        
        // Variables for various operations
        uint16_t address, quantity, value;
        bool boolValue;
        int bytes_read;
        bool coilValues[32];
        uint16_t regValues[32];
        
        switch (choice) {
            case 1:  // Read Coils
                printf("Enter starting address: ");
                scanf("%hu", &address);
                while (getchar() != '\n');
                
                printf("Enter quantity to read (1-32): ");
                scanf("%hu", &quantity);
                while (getchar() != '\n');
                
                if (quantity < 1 || quantity > 32) {
                    printf("Invalid quantity. Must be between 1 and 32.\n");
                    break;
                }
                
                if (send_read_coils(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, address, quantity) == 0) {
                    delay_ms(300); // Wait for response
                    
                    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
                    
                    if (bytes_read > 0) {
                        printf("Received response (%d bytes):\n", bytes_read);
                        print_hex_buffer(buffer, bytes_read);
                        
                        if (!is_exception_response(buffer, bytes_read)) {
                            parse_read_bits_response(buffer, bytes_read, FUNC_READ_COILS);
                        }
                    } else {
                        printf("No response received within timeout period\n");
                    }
                }
                break;
                
            case 2:  // Read Discrete Inputs
                printf("Enter starting address: ");
                scanf("%hu", &address);
                while (getchar() != '\n');
                
                printf("Enter quantity to read (1-32): ");
                scanf("%hu", &quantity);
                while (getchar() != '\n');
                
                if (quantity < 1 || quantity > 32) {
                    printf("Invalid quantity. Must be between 1 and 32.\n");
                    break;
                }
                
                if (send_read_discrete_inputs(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, address, quantity) == 0) {
                    delay_ms(300); // Wait for response
                    
                    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
                    
                    if (bytes_read > 0) {
                        printf("Received response (%d bytes):\n", bytes_read);
                        print_hex_buffer(buffer, bytes_read);
                        
                        if (!is_exception_response(buffer, bytes_read)) {
                            parse_read_bits_response(buffer, bytes_read, FUNC_READ_DISCRETE);
                        }
                    } else {
                        printf("No response received within timeout period\n");
                    }
                }
                break;
                
            case 3:  // Read Holding Registers
                printf("Enter starting address: ");
                scanf("%hu", &address);
                while (getchar() != '\n');
                
                printf("Enter quantity to read (1-32): ");
                scanf("%hu", &quantity);
                while (getchar() != '\n');
                
                if (quantity < 1 || quantity > 32) {
                    printf("Invalid quantity. Must be between 1 and 32.\n");
                    break;
                }
                
                if (send_read_holding_registers(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, address, quantity) == 0) {
                    delay_ms(300); // Wait for response
                    
                    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
                    
                    if (bytes_read > 0) {
                        printf("Received response (%d bytes):\n", bytes_read);
                        print_hex_buffer(buffer, bytes_read);
                        
                        if (!is_exception_response(buffer, bytes_read)) {
                            parse_read_registers_response(buffer, bytes_read, FUNC_READ_HOLDING);
                        }
                    } else {
                        printf("No response received within timeout period\n");
                    }
                }
                break;
                
            case 4:  // Read Input Registers
                printf("Enter starting address: ");
                scanf("%hu", &address);
                while (getchar() != '\n');
                
                printf("Enter quantity to read (1-32): ");
                scanf("%hu", &quantity);
                while (getchar() != '\n');
                
                if (quantity < 1 || quantity > 32) {
                    printf("Invalid quantity. Must be between 1 and 32.\n");
                    break;
                }
                
                if (send_read_input_registers(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, address, quantity) == 0) {
                    delay_ms(300); // Wait for response
                    
                    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
                    
                    if (bytes_read > 0) {
                        printf("Received response (%d bytes):\n", bytes_read);
                        print_hex_buffer(buffer, bytes_read);
                        
                        if (!is_exception_response(buffer, bytes_read)) {
                            parse_read_registers_response(buffer, bytes_read, FUNC_READ_INPUT);
                        }
                    } else {
                        printf("No response received within timeout period\n");
                    }
                }
                break;
                
            case 5:  // Write Single Coil
                printf("Enter coil address: ");
                scanf("%hu", &address);
                while (getchar() != '\n');
                
                printf("Enter value (0=OFF, 1=ON): ");
                int temp;
                scanf("%d", &temp);
                while (getchar() != '\n');
                boolValue = (temp != 0);
                
                if (send_write_coil(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, address, boolValue) == 0) {
                    delay_ms(300); // Wait for response
                    
                    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
                    
                    if (bytes_read > 0) {
                        printf("Received response (%d bytes):\n", bytes_read);
                        print_hex_buffer(buffer, bytes_read);
                        
                        if (!is_exception_response(buffer, bytes_read)) {
                            if (verify_write_response(buffer, bytes_read, FUNC_WRITE_COIL, address, boolValue ? 0xFF00 : 0x0000)) {
                                printf("Coil %d successfully set to %s\n", address, boolValue ? "ON" : "OFF");
                            }
                        }
                    } else {
                        printf("No response received within timeout period\n");
                    }
                }
                break;
                
            case 6:  // Write Single Register
                printf("Enter register address: ");
                scanf("%hu", &address);
                while (getchar() != '\n');
                
                printf("Enter value (0-65535): ");
                scanf("%hu", &value);
                while (getchar() != '\n');
                
                if (send_write_register(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, address, value) == 0) {
                    delay_ms(300); // Wait for response
                    
                    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
                    
                    if (bytes_read > 0) {
                        printf("Received response (%d bytes):\n", bytes_read);
                        print_hex_buffer(buffer, bytes_read);
                        
                        if (!is_exception_response(buffer, bytes_read)) {
                            if (verify_write_response(buffer, bytes_read, FUNC_WRITE_HOLDING, address, value)) {
                                printf("Register %d successfully set to %d (0x%04X)\n", address, value, value);
                            }
                        }
                    } else {
                        printf("No response received within timeout period\n");
                    }
                }
                break;
                
            case 7:  // Write Multiple Coils
                printf("Enter starting address: ");
                scanf("%hu", &address);
                while (getchar() != '\n');
                
                printf("Enter quantity to write (1-32): ");
                scanf("%hu", &quantity);
                while (getchar() != '\n');
                
                if (quantity < 1 || quantity > 32) {
                    printf("Invalid quantity. Must be between 1 and 32.\n");
                    break;
                }
                
                // Get coil values
                printf("Enter values for each coil (0=OFF, 1=ON):\n");
                for (int i = 0; i < quantity; i++) {
                    printf("Coil %d: ", address + i);
                    scanf("%d", &temp);
                    while (getchar() != '\n');
                    coilValues[i] = (temp != 0);
                }
                
                if (send_write_multiple_coils(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, address, quantity, coilValues) == 0) {
                    delay_ms(300); // Wait for response
                    
                    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
                    
                    if (bytes_read > 0) {
                        printf("Received response (%d bytes):\n", bytes_read);
                        print_hex_buffer(buffer, bytes_read);
                        
                        if (!is_exception_response(buffer, bytes_read)) {
                            if (verify_write_response(buffer, bytes_read, FUNC_WRITE_MULTIPLE_COILS, address, 0)) {
                                printf("Coils %d-%d successfully written\n", address, address + quantity - 1);
                            }
                        }
                    } else {
                        printf("No response received within timeout period\n");
                    }
                }
                break;
                
            case 8:  // Write Multiple Registers
                printf("Enter starting address: ");
                scanf("%hu", &address);
                while (getchar() != '\n');
                
                printf("Enter quantity to write (1-32): ");
                scanf("%hu", &quantity);
                while (getchar() != '\n');
                
                if (quantity < 1 || quantity > 32) {
                    printf("Invalid quantity. Must be between 1 and 32.\n");
                    break;
                }
                
                // Get register values
                printf("Enter values for each register (0-65535):\n");
                for (int i = 0; i < quantity; i++) {
                    printf("Register %d: ", address + i);
                    scanf("%hu", &regValues[i]);
                    while (getchar() != '\n');
                }
                
                if (send_write_multiple_registers(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, address, quantity, regValues) == 0) {
                    delay_ms(300); // Wait for response
                    
                    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
                    
                    if (bytes_read > 0) {
                        printf("Received response (%d bytes):\n", bytes_read);
                        print_hex_buffer(buffer, bytes_read);
                        
                        if (!is_exception_response(buffer, bytes_read)) {
                            if (verify_write_response(buffer, bytes_read, FUNC_WRITE_MULTIPLE_REGS, address, 0)) {
                                printf("Registers %d-%d successfully written\n", address, address + quantity - 1);
                            }
                        }
                    } else {
                        printf("No response received within timeout period\n");
                    }
                }
                break;
                
            case 9:  // Toggle LED (Coil 0)
                // Read current state first
                if (send_read_coils(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, 0, 1) == 0) {
                    delay_ms(300); // Wait for response
                    
                    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
                    
                    if (bytes_read > 0) {
                        printf("Current LED state: ");
                        print_hex_buffer(buffer, bytes_read);
                        
                        if (!is_exception_response(buffer, bytes_read)) {
                            bool currentState = false;
                            if (bytes_read >= 5 && buffer[1] == FUNC_READ_COILS && buffer[2] >= 1) {
                                currentState = (buffer[3] & 0x01) != 0;
                                printf("Current LED state: %s\n", currentState ? "ON" : "OFF");
                                
                                // Toggle the state
                                bool newState = !currentState;
                                printf("Toggling LED to: %s\n", newState ? "ON" : "OFF");
                                
                                if (send_write_coil(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, 0, newState) == 0) {
                                    delay_ms(300); // Wait for response
                                    
                                    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
                                    
                                    if (bytes_read > 0) {
                                        printf("Toggle response: ");
                                        print_hex_buffer(buffer, bytes_read);
                                        
                                        if (!is_exception_response(buffer, bytes_read)) {
                                            printf("LED successfully toggled to %s\n", newState ? "ON" : "OFF");
                                        }
                                    } else {
                                        printf("No response received to toggle command\n");
                                    }
                                }
                            }
                        }
                    } else {
                        printf("No response received to read LED state\n");
                    }
                }
                break;
                
            case 0:  // Exit
                printf("Exiting...\n");
                close(serial_fd);
                gpioTerminate();
                return 0;
                
            default:
                printf("Invalid choice\n");
        }
    }
    
    // Clean up (will not reach here in this example)
    close(serial_fd);
    gpioTerminate();
    return 0;
}