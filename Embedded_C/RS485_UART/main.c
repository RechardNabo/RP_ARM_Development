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

// Configuration
#define SERIAL_PORT "/dev/ttyAMA0"  // UART port on RPi, may need to be changed to ttyS0 depending on your RPi model
// Try different baud rates if communication is unreliable
#define BAUD_RATE B9600            // Standard baud rate
//#define BAUD_RATE B4800          // Try slower baud rate
//#define BAUD_RATE B2400          // Try even slower baud rate

// RS485 control
#define SERIAL_COMMUNICATION_CONTROL_PIN 21  // DE/RE pin for RS485 module
#define RS485_TX_PIN_VALUE 1                // HIGH for transmit
#define RS485_RX_PIN_VALUE 0                // LOW for receive

// Buffer size
#define MAX_BUFFER_SIZE 256

// Fixed message to send
#define FIXED_MESSAGE "Raspberry PI 3B MAX485"

// Function to delay milliseconds
void delay_ms(int milliseconds) {
    struct timespec ts;
    ts.tv_sec = milliseconds / 1000;
    ts.tv_nsec = (milliseconds % 1000) * 1000000;
    nanosleep(&ts, NULL);
}

// Function to read available data from serial port with timeout
int read_serial(int fd, char *buffer, int max_size, int timeout_ms) {
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
        // Data is available, read it
        bytes_read = read(fd, buffer, max_size - 1);
        if (bytes_read > 0) {
            buffer[bytes_read] = '\0';  // Null terminate the string
        }
    }
    
    return bytes_read;
}

// Function to send a message over RS485
void send_message(int fd, const char *message, int gpio_pin) {
    // Set to transmit mode
    gpioWrite(gpio_pin, RS485_TX_PIN_VALUE);
    delay_ms(20);  // Short delay after switching to transmit
    
    // Print the message we're sending
    printf("Sending: %s\n", message);
    
    // Send the message
    write(fd, message, strlen(message));
    write(fd, "\r\n", 2);  // Add CR+LF for better compatibility
    
    // Flush the output buffer
    tcdrain(fd);
    
    // Short delay to ensure message is sent
    delay_ms(50);
    
    // Switch back to receive mode
    gpioWrite(gpio_pin, RS485_RX_PIN_VALUE);
    delay_ms(10);  // Short delay after switching to receive
}

// Function to print a buffer in hexadecimal
void print_hex_buffer(const char *buffer, int length) {
    printf("HEX: ");
    for (int i = 0; i < length; i++) {
        printf("%02X ", (unsigned char)buffer[i]);
    }
    printf("\n");
}

// Function to print only printable ASCII characters
void print_ascii_buffer(const char *buffer, int length) {
    printf("ASCII: ");
    for (int i = 0; i < length; i++) {
        if (buffer[i] >= 32 && buffer[i] <= 126) {
            printf("%c", buffer[i]);
        } else {
            printf(".");
        }
    }
    printf("\n");
}

int main() {
    int serial_fd;
    struct termios tty;
    char buffer[MAX_BUFFER_SIZE];
    time_t lastSendTime = 0;
    const int SEND_INTERVAL_MS = 3000;  // Send every 3 seconds
    
    // Initialize pigpio library
    if (gpioInitialise() < 0) {
        fprintf(stderr, "Failed to initialize pigpio\n");
        return 1;
    }
    
    printf("RS485 Communication Program Starting\n");
    
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
    
    printf("Serial port configured successfully at baud rate %d\n", 
           BAUD_RATE == B9600 ? 9600 : (BAUD_RATE == B4800 ? 4800 : 2400));
    
    // Main loop
    while (1) {
        // Get current time
        struct timespec ts;
        clock_gettime(CLOCK_MONOTONIC, &ts);
        time_t current_time_ms = ts.tv_sec * 1000 + ts.tv_nsec / 1000000;
        
        // Check if it's time to send a message
        if (current_time_ms - lastSendTime >= SEND_INTERVAL_MS) {
            send_message(serial_fd, FIXED_MESSAGE, SERIAL_COMMUNICATION_CONTROL_PIN);
            lastSendTime = current_time_ms;
        }
        
        // Check for incoming data with a shorter timeout
        int bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 100);
        
        if (bytes_read > 0) {
            // Print the data in different formats for debugging
            printf("\n[%ld ms] Data received (%d bytes):\n", current_time_ms, bytes_read);
            printf("String: %s\n", buffer);
            print_hex_buffer(buffer, bytes_read);
            print_ascii_buffer(buffer, bytes_read);
            
            // Check for ESP32 message
            if (strstr(buffer, "ESP32") != NULL) {
                printf("Detected ESP32 message!\n");
            }
        }
        
        // Short delay to prevent CPU hogging
        delay_ms(50);
    }
    
    // Clean up (this code will not be reached in this example)
    close(serial_fd);
    gpioTerminate();
    return 0;
}
