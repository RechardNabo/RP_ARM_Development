#include <stdio.h>
#include <pigpio.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/i2c-dev.h>
#include <linux/spi/spidev.h>
#include <string.h>
#include <signal.h>
#include <stdbool.h>

// ... [Previous definitions remain the same] ...

// Global variables for graceful exit
volatile bool running = true;
int i2c_fd = -1;
int spi_fd = -1;
int uart_fd = -1;

// Signal handler for graceful exit
void handle_signal(int signum) {
    printf("\nReceived signal %d. Initiating graceful shutdown...\n", signum);
    running = false;
}

// Cleanup function
void cleanup_resources() {
    printf("Cleaning up resources...\n");
    
    // Stop PWM
    stop_pwm();
    
    // Close file descriptors
    if (i2c_fd >= 0) {
        close(i2c_fd);
        printf("I2C connection closed\n");
    }
    if (spi_fd >= 0) {
        close(spi_fd);
        printf("SPI connection closed\n");
    }
    if (uart_fd >= 0) {
        close(uart_fd);
        printf("UART connection closed\n");
    }
    
    // Terminate GPIO
    gpioTerminate();
    printf("GPIO terminated\n");
}

// ... [Previous function definitions remain the same until main()] ...

int main() {
    // Set up signal handlers
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);

    // Initialize pigpio
    if (gpioInitialise() < 0) {
        fprintf(stderr, "Failed to initialize pigpio\n");
        return 1;
    }

    // Initial setup
    setup_gpio();
    setup_pwm(1000, 50); // Set PWM at 1kHz, 50% duty cycle
    setup_interrupt(GPIO_PIN, interrupt_callback);
    
    // Setup I2C, SPI, and UART
    i2c_fd = setup_i2c();
    spi_fd = setup_spi();
    uart_fd = setup_uart();

    printf("All devices initialized. Starting main loop...\n");
    printf("Press Ctrl+C to exit\n");

    // Main loop
    while (running) {
        // GPIO operations
        write_gpio(1);
        printf("GPIO Value: %d\n", read_gpio());
        
        // I2C operations
        char i2c_data[] = {0x01};
        write_i2c(i2c_fd, i2c_data, sizeof(i2c_data));
        char i2c_buffer[10];
        read_i2c(i2c_fd, i2c_buffer, sizeof(i2c_buffer));
        
        // SPI operations
        char spi_tx[] = {0xAA};
        char spi_rx[sizeof(spi_tx)] = {0};
        transfer_spi(spi_fd, spi_tx, spi_rx, sizeof(spi_tx));
        
        // UART operations
        write_uart(uart_fd, "Hello UART\n");
        char uart_buffer[100];
        read_uart(uart_fd, uart_buffer, sizeof(uart_buffer));
        printf("UART Received: %s\n", uart_buffer);
        
        // Add a delay to prevent excessive CPU usage
        sleep(1);
    }

    // Cleanup and exit
    cleanup_resources();
    printf("Program terminated successfully\n");
    return 0;
}