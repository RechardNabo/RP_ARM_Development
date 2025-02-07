#include <stdio.h>
#include <pigpio.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/i2c-dev.h>
#include <linux/spi/spidev.h>
#include <string.h>

#define GPIO_PIN 17 // Example GPIO pin
#define PWM_PIN 18  // Example PWM pin
#define I2C_BUS 1   // I2C Bus (e.g., 1 for /dev/i2c-1)
#define I2C_ADDR 0x20 // I2C Device Address
#define SPI_DEVICE "/dev/spidev0.0" // SPI Device
#define SPI_SPEED 500000 // SPI Speed in Hz
#define UART_DEVICE "/dev/serial0" // UART Device

// Function Prototypes
void setup_gpio();
void write_gpio(int value);
int read_gpio();

void setup_pwm(int frequency, int duty_cycle);
void stop_pwm();

void setup_interrupt(int pin, void (*callback)(int, int, uint32_t));

int setup_i2c();
void write_i2c(int fd, char *data, size_t len);
void read_i2c(int fd, char *buffer, size_t len);

int setup_spi();
void transfer_spi(int fd, char *tx_buffer, char *rx_buffer, size_t len);

int setup_uart();
void write_uart(int fd, const char *data);
void read_uart(int fd, char *buffer, size_t len);

void interrupt_callback(int gpio, int level, uint32_t tick);

int main() {
    if (gpioInitialise() < 0) {
        fprintf(stderr, "Failed to initialize pigpio\n");
        return 1;
    }

    // GPIO Example
    setup_gpio();
    write_gpio(1);
    printf("GPIO Value: %d\n", read_gpio());

    // PWM Example
    setup_pwm(1000, 50); // Set PWM at 1kHz, 50% duty cycle
    sleep(5); // Run PWM for 5 seconds
    stop_pwm();

    // Interrupt Example
    setup_interrupt(GPIO_PIN, interrupt_callback);
    printf("Interrupt setup on GPIO %d. Waiting...\n", GPIO_PIN);
    sleep(10); // Wait for interrupts

    // I2C Example
    int i2c_fd = setup_i2c();
    char i2c_data[] = {0x01};
    write_i2c(i2c_fd, i2c_data, sizeof(i2c_data));
    char i2c_buffer[10];
    read_i2c(i2c_fd, i2c_buffer, sizeof(i2c_buffer));
    close(i2c_fd);

    // SPI Example
    int spi_fd = setup_spi();
    char spi_tx[] = {0xAA};
    char spi_rx[sizeof(spi_tx)] = {0};
    transfer_spi(spi_fd, spi_tx, spi_rx, sizeof(spi_tx));
    close(spi_fd);

    // UART Example
    int uart_fd = setup_uart();
    write_uart(uart_fd, "Hello UART\n");
    char uart_buffer[100];
    read_uart(uart_fd, uart_buffer, sizeof(uart_buffer));
    printf("UART Received: %s\n", uart_buffer);
    close(uart_fd);

    gpioTerminate();
    return 0;
}

// GPIO Functions
void setup_gpio() {
    gpioSetMode(GPIO_PIN, PI_OUTPUT);
}

void write_gpio(int value) {
    gpioWrite(GPIO_PIN, value);
}

int read_gpio() {
    return gpioRead(GPIO_PIN);
}

// PWM Functions
void setup_pwm(int frequency, int duty_cycle) {
    gpioSetMode(PWM_PIN, PI_OUTPUT);
    gpioHardwarePWM(PWM_PIN, frequency, duty_cycle * 10000); // duty_cycle in range 0-100% scaled to 0-1M
}

void stop_pwm() {
    gpioHardwarePWM(PWM_PIN, 0, 0); // Stop PWM
}

// Interrupt Functions
void setup_interrupt(int pin, void (*callback)(int, int, uint32_t)) {
    gpioSetMode(pin, PI_INPUT);
    gpioSetAlertFunc(pin, callback);
}

void interrupt_callback(int gpio, int level, uint32_t tick) {
    printf("Interrupt detected on GPIO %d. Level: %d, Tick: %u\n", gpio, level, tick);
}

// I2C Functions
int setup_i2c() {
    char device[20];
    snprintf(device, sizeof(device), "/dev/i2c-%d", I2C_BUS);
    int fd = open(device, O_RDWR);
    if (fd < 0) {
        perror("Failed to open I2C device");
        exit(1);
    }
    if (ioctl(fd, I2C_SLAVE, I2C_ADDR) < 0) {
        perror("Failed to set I2C address");
        close(fd);
        exit(1);
    }
    return fd;
}

void write_i2c(int fd, char *data, size_t len) {
    if (write(fd, data, len) != len) {
        perror("Failed to write to I2C device");
    }
}

void read_i2c(int fd, char *buffer, size_t len) {
    if (read(fd, buffer, len) != len) {
        perror("Failed to read from I2C device");
    }
}

// SPI Functions
int setup_spi() {
    int fd = open(SPI_DEVICE, O_RDWR);
    if (fd < 0) {
        perror("Failed to open SPI device");
        exit(1);
    }
    uint8_t mode = SPI_MODE_0;
    uint8_t bits = 8;
    uint32_t speed = SPI_SPEED;
    if (ioctl(fd, SPI_IOC_WR_MODE, &mode) < 0 || ioctl(fd, SPI_IOC_WR_BITS_PER_WORD, &bits) < 0 || ioctl(fd, SPI_IOC_WR_MAX_SPEED_HZ, &speed) < 0) {
        perror("Failed to configure SPI device");
        close(fd);
        exit(1);
    }
    return fd;
}

void transfer_spi(int fd, char *tx_buffer, char *rx_buffer, size_t len) {
    struct spi_ioc_transfer tr = {
        .tx_buf = (unsigned long)tx_buffer,
        .rx_buf = (unsigned long)rx_buffer,
        .len = len
    };
    if (ioctl(fd, SPI_IOC_MESSAGE(1), &tr) < 0) {
        perror("Failed to transfer via SPI");
    }
}

// UART Functions
int setup_uart() {
    int fd = open(UART_DEVICE, O_RDWR | O_NOCTTY);
    if (fd < 0) {
        perror("Failed to open UART device");
        exit(1);
    }
    return fd;
}

void write_uart(int fd, const char *data) {
    if (write(fd, data, strlen(data)) < 0) {
        perror("Failed to write to UART device");
    }
}

void read_uart(int fd, char *buffer, size_t len) {
    ssize_t bytes = read(fd, buffer, len);
    if (bytes < 0) {
        perror("Failed to read from UART device");
    } else {
        buffer[bytes] = '\0';
    }
}
