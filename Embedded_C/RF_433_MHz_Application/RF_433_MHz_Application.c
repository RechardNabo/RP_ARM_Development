#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <stdbool.h>
#include <errno.h>
#include <time.h>
#include <pigpio.h>
#include <signal.h>
#include <ctype.h>

// Configuration
#define RF_RX_PIN 26                    // GPIO pin for RF 433MHz receiver
#define DEFAULT_PULSE_LENGTH 350        // Default pulse length in microseconds
#define DEFAULT_PROTOCOL 1              // Default protocol
#define SYNC_HIGH 31                    // Sync signal high duration multiplier
#define SYNC_LOW 31                     // Sync signal low duration multiplier
#define ZERO_HIGH 1                     // Zero bit high duration multiplier
#define ZERO_LOW 3                      // Zero bit low duration multiplier  
#define ONE_HIGH 3                      // One bit high duration multiplier
#define ONE_LOW 1                       // One bit low duration multiplier
#define MAX_CODE_LENGTH 32              // Maximum bits in a code

// Global variables
volatile bool running = true;
int pulse_length = DEFAULT_PULSE_LENGTH;
bool debug_mode = false;
bool verbose_mode = false;
bool ascii_mode = true;                 // Enable ASCII decoding by default

// Function to delay microseconds
void delay_us(int microseconds) {
    struct timespec ts;
    ts.tv_sec = 0;
    ts.tv_nsec = microseconds * 1000;
    nanosleep(&ts, NULL);
}

// Function to delay milliseconds
void delay_ms(int milliseconds) {
    struct timespec ts;
    ts.tv_sec = milliseconds / 1000;
    ts.tv_nsec = (milliseconds % 1000) * 1000000;
    nanosleep(&ts, NULL);
}

// Signal handler for clean exit
void signal_handler(int sig) {
    printf("\nReceived signal %d, shutting down...\n", sig);
    running = false;
}

// Function to convert binary string to ASCII text
void binary_to_ascii(const char* binary_str, int bit_length) {
    printf("  ASCII decoding attempt:\n");
    
    // Try 8-bit ASCII chunks
    if (bit_length >= 8) {
        printf("    8-bit ASCII: \"");
        for (int i = 0; i <= bit_length - 8; i += 8) {
            char byte_str[9] = {0};
            strncpy(byte_str, binary_str + i, 8);
            byte_str[8] = '\0';
            
            unsigned char ascii_char = (unsigned char)strtoul(byte_str, NULL, 2);
            
            if (ascii_char >= 32 && ascii_char <= 126) {
                printf("%c", ascii_char);
            } else if (ascii_char == 10) {
                printf("\\n");
            } else if (ascii_char == 13) {
                printf("\\r");
            } else if (ascii_char == 9) {
                printf("\\t");
            } else if (ascii_char == 0) {
                printf("\\0");
            } else {
                printf("\\x%02X", ascii_char);
            }
        }
        printf("\"\n");
    }
    
    // Try 7-bit ASCII chunks
    if (bit_length >= 7) {
        printf("    7-bit ASCII: \"");
        for (int i = 0; i <= bit_length - 7; i += 7) {
            char byte_str[8] = {0};
            strncpy(byte_str, binary_str + i, 7);
            byte_str[7] = '\0';
            
            unsigned char ascii_char = (unsigned char)strtoul(byte_str, NULL, 2);
            
            if (ascii_char >= 32 && ascii_char <= 126) {
                printf("%c", ascii_char);
            } else {
                printf(".");
            }
        }
        printf("\"\n");
    }
    
    // Try interpreting as packed decimal (BCD)
    printf("    BCD (4-bit): ");
    for (int i = 0; i <= bit_length - 4; i += 4) {
        char nibble_str[5] = {0};
        strncpy(nibble_str, binary_str + i, 4);
        nibble_str[4] = '\0';
        unsigned int nibble_val = strtoul(nibble_str, NULL, 2);
        
        if (nibble_val <= 9) {
            printf("%d", nibble_val);
        } else {
            printf("X");
        }
    }
    printf("\n");
}

// Function to decode received RF signal timing (KEEPING ORIGINAL LOGIC)
void decode_rf_signal(uint32_t duration, int level) {
    static uint32_t code_buffer[MAX_CODE_LENGTH * 2]; // Store pulse durations
    static int pulse_count = 0;
    static bool receiving = false;
    static uint32_t last_long_pause = 0;
    
    // Debug output for pulse detection
    if (debug_mode) {
        printf("  Pulse: level=%d, duration=%u us\n", level, duration);
    }
    
    // Detect start of transmission (long pause followed by signal)
    if (level == 1 && duration > pulse_length * 20) {
        pulse_count = 0;
        receiving = true;
        last_long_pause = duration;
        memset(code_buffer, 0, sizeof(code_buffer));
        if (debug_mode) {
            printf("  Start of transmission detected (sync: %u us)\n", duration);
        }
        return;
    }
    
    if (receiving && pulse_count < MAX_CODE_LENGTH * 2) {
        code_buffer[pulse_count] = duration;
        pulse_count++;
        
        // Process complete code when we have enough pulses or detect end
        if (pulse_count >= 48 || (level == 0 && duration > pulse_length * 20)) {
            // Decode the received pulses into bits
            char decoded_bits[MAX_CODE_LENGTH + 1] = {0};
            int bit_index = 0;
            
            if (debug_mode) {
                printf("  Processing %d pulses:\n", pulse_count);
            }
            
            // Process pairs of pulses (high/low) to determine bits
            for (int i = 0; i < pulse_count - 1 && bit_index < MAX_CODE_LENGTH; i += 2) {
                uint32_t high_duration = code_buffer[i];
                uint32_t low_duration = code_buffer[i + 1];
                
                if (debug_mode) {
                    printf("    Pulse pair %d: H=%u, L=%u", i/2, high_duration, low_duration);
                }
                
                // Determine bit based on pulse durations
                if (high_duration < pulse_length * 2 && low_duration > pulse_length * 2) {
                    decoded_bits[bit_index] = '0'; // Short high, long low = 0
                    if (debug_mode) printf(" -> 0\n");
                } else if (high_duration > pulse_length * 2 && low_duration < pulse_length * 2) {
                    decoded_bits[bit_index] = '1'; // Long high, short low = 1
                    if (debug_mode) printf(" -> 1\n");
                } else {
                    if (debug_mode) printf(" -> invalid\n");
                    continue; // Invalid timing, skip
                }
                bit_index++;
            }
            
            if (bit_index >= 12) { // Minimum valid code length
                decoded_bits[bit_index] = '\0';
                unsigned long received_code = strtoul(decoded_bits, NULL, 2);
                
                if (received_code > 0) {
                    time_t now = time(NULL);
                    struct tm *local_time = localtime(&now);
                    
                    printf("\n[%02d:%02d:%02d] RF Code Received: %lu (binary: %s, %d bits)\n", 
                           local_time->tm_hour, local_time->tm_min, local_time->tm_sec,
                           received_code, decoded_bits, bit_index);
                    
                    printf("  Hexadecimal: 0x%lX\n", received_code);
                    
                    // Print pulse analysis for debugging
                    printf("  Pulse analysis: %d total pulses, sync pause: %u us\n", 
                           pulse_count, last_long_pause);
                    
                    // Add ASCII decoding
                    if (ascii_mode) {
                        binary_to_ascii(decoded_bits, bit_index);
                    }
                    
                    printf("\n");
                }
            } else if (debug_mode) {
                printf("  Code too short: only %d bits decoded\n", bit_index);
            }
            
            receiving = false;
            pulse_count = 0;
        }
    }
}

// Callback function for RF receiver (KEEPING ORIGINAL)
void rf_rx_callback(int gpio, int level, uint32_t tick) {
    static uint32_t last_tick = 0;
    static uint32_t last_duration = 0;
    
    if (last_tick == 0) {
        last_tick = tick;
        return;
    }
    
    uint32_t duration = tick - last_tick;
    last_tick = tick;
    
    // Filter out very short pulses (noise)
    if (duration < 50) {
        return;
    }
    
    // Pass timing information to decoder
    decode_rf_signal(duration, level);
}

// Function to setup RF receiver (KEEPING ORIGINAL)
void setup_receiver() {
    printf("Setting up RF 433MHz receiver on GPIO %d\n", RF_RX_PIN);
    gpioSetMode(RF_RX_PIN, PI_INPUT);
    gpioSetPullUpDown(RF_RX_PIN, PI_PUD_DOWN);
    
    // Set up interrupt for both rising and falling edges
    gpioSetAlertFunc(RF_RX_PIN, rf_rx_callback);
    
    printf("RF receiver ready. Listening for 433MHz signals...\n");
}

// Function to print usage information
void print_usage(const char* program_name) {
    printf("RF 433MHz Receiver with ASCII Decoding\n");
    printf("======================================\n");
    printf("Usage: %s [OPTIONS]\n", program_name);
    printf("Options:\n");
    printf("  -p PULSE    Expected pulse length in microseconds (default: %d)\n", DEFAULT_PULSE_LENGTH);
    printf("  -d          Enable debug mode for detailed pulse analysis\n");
    printf("  -v          Verbose output\n");
    printf("  -a          Enable ASCII decoding (default: enabled)\n");
    printf("  -n          Disable ASCII decoding (numbers only)\n");
    printf("  -h          Show this help message\n");
    printf("\nThis application listens for RF 433MHz signals on GPIO %d\n", RF_RX_PIN);
    printf("Press Ctrl+C to exit.\n");
    printf("\nExamples:\n");
    printf("  %s                   # Listen with ASCII decoding\n", program_name);
    printf("  %s -p 400            # Listen with 400us pulse length\n", program_name);
    printf("  %s -d -v             # Listen with debug and verbose output\n", program_name);
    printf("  %s -n                # Numbers only (no ASCII decoding)\n", program_name);
}

int main(int argc, char *argv[]) {
    int opt;
    
    // Parse command line arguments
    while ((opt = getopt(argc, argv, "p:dvahn")) != -1) {
        switch (opt) {
            case 'p':
                pulse_length = atoi(optarg);
                if (pulse_length < 100 || pulse_length > 1000) {
                    printf("Warning: Pulse length should be between 100-1000 microseconds\n");
                }
                break;
            case 'd':
                debug_mode = true;
                break;
            case 'v':
                verbose_mode = true;
                break;
            case 'a':
                ascii_mode = true;
                break;
            case 'n':
                ascii_mode = false;
                break;
            case 'h':
                print_usage(argv[0]);
                return 0;
            default:
                print_usage(argv[0]);
                return 1;
        }
    }
    
    // Initialize pigpio library with custom port (KEEPING ORIGINAL LOGIC)
    gpioCfgSocketPort(8889); // Use port 8889 instead of 8888
    
    int pigpio_result = gpioInitialise();
    if (pigpio_result < 0) {
        fprintf(stderr, "Failed to initialize pigpio library (error: %d)\n", pigpio_result);
        fprintf(stderr, "\nTrying alternative port 8890...\n");
        
        // Try another port if 8889 is also busy
        gpioCfgSocketPort(8890);
        pigpio_result = gpioInitialise();
        
        if (pigpio_result < 0) {
            fprintf(stderr, "Failed to initialize pigpio library on alternative port (error: %d)\n", pigpio_result);
            fprintf(stderr, "\nTroubleshooting steps:\n");
            fprintf(stderr, "1. Stop existing pigpiod daemon: sudo killall pigpiod\n");
            fprintf(stderr, "2. Check what's using ports 8888-8890: sudo netstat -tulpn | grep 888\n");
            fprintf(stderr, "3. Make sure to run this program with sudo privileges\n");
            return 1;
        } else {
            printf("Successfully initialized pigpio library on port 8890\n");
        }
    } else {
        printf("Successfully initialized pigpio library on port 8889\n");
    }
    
    printf("RF 433MHz Receiver with ASCII Decoding\n");
    printf("======================================\n");
    printf("GPIO Pin: %d\n", RF_RX_PIN);
    printf("Expected pulse length: %d microseconds\n", pulse_length);
    printf("Debug mode: %s\n", debug_mode ? "Enabled" : "Disabled");
    printf("Verbose mode: %s\n", verbose_mode ? "Enabled" : "Disabled");
    printf("ASCII decoding: %s\n", ascii_mode ? "Enabled" : "Disabled");
    printf("======================================\n\n");
    
    // Setup signal handlers for clean exit
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    
    // Setup the RF receiver
    setup_receiver();
    
    printf("Monitoring RF 433MHz signals...\n");
    printf("Press Ctrl+C to exit.\n\n");
    
    // Main loop - just keep the program running (KEEPING ORIGINAL)
    while (running) {
        delay_ms(100); // Small delay to prevent CPU hogging
        
        if (verbose_mode) {
            // Periodically show that we're still listening
            static int counter = 0;
            if (++counter >= 100) { // Every 10 seconds
                printf("Still listening... (Press Ctrl+C to exit)\n");
                counter = 0;
            }
        }
    }
    
    // Clean up
    printf("\nShutting down RF receiver...\n");
    gpioTerminate();
    printf("RF 433MHz Application terminated.\n");
    
    return 0;
}
