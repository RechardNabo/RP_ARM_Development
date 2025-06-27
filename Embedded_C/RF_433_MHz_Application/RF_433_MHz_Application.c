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
#define DEFAULT_BAUD_RATE 2000          // Default baud rate (must match PIC32MX sender)
#define DEFAULT_PULSE_LENGTH 500        // Default pulse length in microseconds (1000000/baud_rate)
#define MAX_MESSAGE_LEN 128             // Maximum message length

// Protocol constants (matching PIC32MX RF transmitter)
#define RF_PREAMBLE_LENGTH 36           // 36 alternating bits
#define RF_START_SYMBOL 0xB38           // 12-bit start symbol
#define MAX_CODE_LENGTH 64              // Maximum bits in a code

// Reception modes
typedef enum {
    MODE_BASIC_ASCII = 1,             // Basic ASCII transmission
    MODE_STRUCTURED_PROTOCOL = 2,      // Protocol with preamble, start symbol and CRC
    MODE_MANCHESTER_ENCODING = 3       // Manchester encoding for noise immunity
} ReceiveMode;

// Global variables
volatile bool running = true;
int pulse_length = DEFAULT_PULSE_LENGTH;
bool debug_mode = false;
bool verbose_mode = false;
<<<<<<< HEAD
ReceiveMode current_mode = MODE_BASIC_ASCII;

// 4-to-6 bit decoding lookup table (reverse of PIC32MX encoding)
const uint8_t decode_6to4_table[64] = {
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x01, 0xFF,
    0xFF, 0xFF, 0xFF, 0x02, 0xFF, 0x03, 0x04, 0xFF,
    0xFF, 0x05, 0x06, 0xFF, 0x07, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0x08, 0xFF, 0x09, 0x0A, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x0B, 0xFF
};
=======
bool ascii_mode = true;                 // Enable ASCII decoding by default
>>>>>>> dcd7bdc81f56b53a44fe2049b97f49a707a8c7a1

// Function to delay microseconds
void delay_us(int microseconds) {
    struct timespec ts;
    ts.tv_sec = 0;
    ts.tv_nsec = microseconds * 1000;
    nanosleep(&ts, NULL);
}

// Signal handler for Ctrl+C and other termination signals
void signal_handler(int sig) {
    running = false;
    printf("\nReceived signal %d, exiting...\n", sig);
}

// Calculate CRC-16 (CCITT variant) - same as in PIC32MX code
uint16_t calculate_crc16(const uint8_t* data, uint8_t length) {
    uint16_t crc = 0xFFFF; // Initial value
    
    for (uint8_t i = 0; i < length; i++) {
        crc ^= data[i];
        for (uint8_t j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc >>= 1;
                crc ^= 0xA001; // Polynomial 0x8005 (reversed)
            } else {
                crc >>= 1;
            }
        }
    }
    
    return crc;
}

// Decode a 6-bit symbol to its 4-bit value
uint8_t decode_symbol_6to4(uint8_t symbol) {
    if (symbol < 64) {
        return decode_6to4_table[symbol];
    }
    return 0xFF; // Invalid symbol
}

// Detect preamble (alternating 1-0 pattern)
bool detect_preamble(int rx_pin) {
    int transitions = 0;
    int last_value = -1;
    int bit_duration = 1000000 / DEFAULT_BAUD_RATE;
    
    // Look for alternating pattern
    for (int i = 0; i < RF_PREAMBLE_LENGTH + 6; i++) {
        int value = gpioRead(rx_pin);
        
        if (last_value != -1 && value != last_value) {
            transitions++;
        }
        
        last_value = value;
        delay_us(bit_duration / 2); // Sample at half-bit intervals
    }
    
    // Need at least 2/3 of expected transitions in preamble
    if (transitions >= (RF_PREAMBLE_LENGTH * 2 / 3)) {
        if (debug_mode) {
            printf("Preamble detected with %d transitions\n", transitions);
        }
        return true;
    }
    
    return false;
}

// Detect start symbol (0xB38 = 0b101100111000)
bool detect_start_symbol(int rx_pin) {
    uint16_t received = 0;
    int bit_duration = 1000000 / DEFAULT_BAUD_RATE;
    
    // Receive 12 bits
    for (int i = 0; i < 12; i++) {
        // Sample in the middle of the bit
        delay_us(bit_duration / 2);
        int bit = gpioRead(rx_pin);
        received = (received << 1) | bit;
        delay_us(bit_duration / 2);
    }
    
    if (debug_mode) {
        printf("Received potential start symbol: 0x%03X (expected 0x%03X)\n", 
               received, RF_START_SYMBOL);
    }
    
    // Allow some bit errors (up to 2)
    int bit_diff = 0;
    uint16_t xor_result = received ^ RF_START_SYMBOL;
    
    for (int i = 0; i < 12; i++) {
        if ((xor_result >> i) & 0x01) bit_diff++;
    }
    
    return (bit_diff <= 2);
}

// Receive a byte using direct bit sampling
uint8_t receive_byte(int rx_pin) {
    uint8_t byte = 0;
    int bit_duration = 1000000 / DEFAULT_BAUD_RATE;
    
    for (int i = 0; i < 8; i++) {
        // Wait for half a bit period to sample in the middle
        delay_us(bit_duration / 2);
        
        // Sample the bit
        int bit = gpioRead(rx_pin);
        byte = (byte >> 1) | (bit ? 0x80 : 0);
        
        // Wait for the second half of the bit period
        delay_us(bit_duration / 2);
    }
    
    return byte;
}

// Receive a Manchester encoded byte
uint8_t receive_manchester_byte(int rx_pin) {
    uint8_t byte = 0;
    int bit_duration = 1000000 / DEFAULT_BAUD_RATE;
    
    for (int i = 0; i < 8; i++) {
        // For Manchester encoding, we need to check transitions
        delay_us(bit_duration / 2);
        int first_half = gpioRead(rx_pin);
        delay_us(bit_duration / 2);
        int second_half = gpioRead(rx_pin);
        
        // Manchester decode: 10 = 1, 01 = 0
        if (first_half == 1 && second_half == 0) {
            byte = (byte >> 1) | 0x80; // Bit is 1
        } else if (first_half == 0 && second_half == 1) {
            byte = (byte >> 1);       // Bit is 0
        } else {
            // Error in Manchester encoding
            if (debug_mode) {
                printf("Manchester decoding error at bit %d: %d%d\n", i, first_half, second_half);
            }
            // Use best guess based on first half
            byte = (byte >> 1) | (first_half ? 0x80 : 0);
        }
    }
    
    return byte;
}

// Receive a 4-to-6 bit encoded byte (two 6-bit symbols)
uint8_t receive_4to6_encoded_byte(int rx_pin) {
    uint8_t high_nibble, low_nibble;
    uint8_t high_symbol = 0, low_symbol = 0;
    int bit_duration = 1000000 / DEFAULT_BAUD_RATE;
    
    // Read first 6-bit symbol (high nibble)
    for (int i = 0; i < 6; i++) {
        delay_us(bit_duration / 2);
        int bit = gpioRead(rx_pin);
        high_symbol = (high_symbol >> 1) | (bit ? 0x20 : 0);
        delay_us(bit_duration / 2);
    }
    
    // Read second 6-bit symbol (low nibble)
    for (int i = 0; i < 6; i++) {
        delay_us(bit_duration / 2);
        int bit = gpioRead(rx_pin);
        low_symbol = (low_symbol >> 1) | (bit ? 0x20 : 0);
        delay_us(bit_duration / 2);
    }
    
    // Decode symbols to 4-bit values
    high_nibble = decode_symbol_6to4(high_symbol);
    low_nibble = decode_symbol_6to4(low_symbol);
    
    if (high_nibble == 0xFF || low_nibble == 0xFF) {
        if (debug_mode) {
            printf("Invalid 4-to-6 symbol: H=0x%02X, L=0x%02X\n", high_symbol, low_symbol);
        }
        return 0xFF;
    }
    
    // Combine into one byte
    return (high_nibble << 4) | low_nibble;
}

// Function to delay milliseconds
void delay_ms(int milliseconds) {
    struct timespec ts;
    ts.tv_sec = milliseconds / 1000;
    ts.tv_nsec = (milliseconds % 1000) * 1000000;
    nanosleep(&ts, NULL);
}

// Function to receive a basic ASCII message
bool receive_basic_ascii_message(int rx_pin, char* message, int max_length) {
    memset(message, 0, max_length);
    int byte_count = 0;
    time_t start_time = time(NULL);
    
    if (verbose_mode) {
        printf("Listening for basic ASCII message...\n");
    }
    
    // Listen for a period of time
    while (running && time(NULL) - start_time < 5 && byte_count < max_length - 1) {
        // Look for a high signal that may indicate a transmission
        if (gpioRead(rx_pin) == 1) {
            // Receive a byte
            uint8_t byte = receive_byte(rx_pin);
            
            // Add it to the message if it's printable ASCII or common control char
            if ((byte >= 32 && byte <= 126) || byte == '\n' || byte == '\r' || byte == '\t') {
                message[byte_count++] = (char)byte;
                if (verbose_mode) {
                    printf("." ); // Show progress
                    fflush(stdout);
                }
                
                // If we receive a terminating character, we're done
                if (byte == '\0' || byte == '\n') {
                    break;
                }
            } else if (byte == 0) {
                // Likely noise, wait a bit and continue
                delay_ms(10);
            } else {
                if (debug_mode) {
                    printf("Received non-ASCII byte: 0x%02X\n", byte);
                }
            }
        } else {
            // No signal, short delay before checking again
            delay_ms(5);
        }
    }
    
    message[byte_count] = '\0'; // Ensure null termination
    
    return byte_count > 0;
}

<<<<<<< HEAD
// Function to receive a structured protocol message
bool receive_structured_protocol_message(int rx_pin, char* message, int max_length) {
    memset(message, 0, max_length);
    time_t start_time = time(NULL);
    
    if (verbose_mode) {
        printf("Listening for structured protocol message...\n");
    }
    
    while (running && time(NULL) - start_time < 10) {
        // 1. Look for preamble
        if (detect_preamble(rx_pin)) {
            if (verbose_mode) printf("P"); // Preamble detected
            
            // 2. Look for start symbol
            if (detect_start_symbol(rx_pin)) {
                if (verbose_mode) printf("S"); // Start symbol detected
                
                // 3. Read length byte
                uint8_t length = receive_byte(rx_pin);
                
                // Safety check on length
                if (length < 3 || length > max_length) { 
                    if (debug_mode) {
                        printf("Invalid length: %d\n", length);
                    }
                    continue;
                }
                
                // 4. Read data with 4-to-6 bit decoding
                uint8_t data[MAX_MESSAGE_LEN];
                int msg_len = length - 2; // subtract CRC bytes
                
                if (verbose_mode) printf("(L:%d)", msg_len);
                
                // Read the message bytes
                for (int i = 0; i < msg_len; i++) {
                    data[i] = receive_4to6_encoded_byte(rx_pin);
                    
                    // Check for invalid symbol
                    if (data[i] == 0xFF) {
                        if (debug_mode) {
                            printf("Invalid 4-to-6 encoded byte at position %d\n", i);
                        }
                        break;
                    }
                    
                    // If valid ASCII, copy to message
                    if (i < max_length - 1) {
                        message[i] = (char)data[i];
                    }
                    
                    if (verbose_mode) printf(".");
                }
                
                // 5. Read CRC
                uint8_t crc_low = receive_4to6_encoded_byte(rx_pin);
                uint8_t crc_high = receive_4to6_encoded_byte(rx_pin);
                
                if (crc_low == 0xFF || crc_high == 0xFF) {
                    if (debug_mode) {
                        printf("Invalid CRC bytes\n");
                    }
                    continue;
                }
                
                uint16_t received_crc = (crc_high << 8) | crc_low;
                uint16_t calculated_crc = calculate_crc16(data, msg_len);
                
                if (received_crc == calculated_crc) {
                    if (verbose_mode) printf("[CRC-OK]\n");
                    message[msg_len] = '\0'; // Ensure null termination
                    return true;
                } else {
                    if (debug_mode) {
                        printf("CRC error: received 0x%04X, calculated 0x%04X\n", 
                               received_crc, calculated_crc);
                    }
                }
            }
        }
        
        // Short delay before next detection attempt
        delay_ms(10);
    }
    
    return false; // No valid message received
}

// Function to receive a Manchester encoded message
bool receive_manchester_message(int rx_pin, char* message, int max_length) {
    memset(message, 0, max_length);
    int byte_count = 0;
    time_t start_time = time(NULL);
    
    if (verbose_mode) {
        printf("Listening for Manchester encoded message...\n");
    }
    
    // First look for preamble (even Manchester encoded messages use a simple preamble)
    while (running && time(NULL) - start_time < 10) {
        // Look for repeated high-low pattern that indicates Manchester preamble
        int high_low_pattern = 0;
        int bit_duration = 1000000 / DEFAULT_BAUD_RATE;
        
        for (int i = 0; i < 8; i++) {
            // Check for high-low pattern
            if (gpioRead(rx_pin) == 1) {
                delay_us(bit_duration / 2);
                if (gpioRead(rx_pin) == 0) {
                    high_low_pattern++;
                    delay_us(bit_duration / 2);
                }
            } else {
                delay_us(bit_duration);
            }
        }
        
        // If we see enough transitions, likely a Manchester preamble
        if (high_low_pattern >= 5) {
            // Now read bytes until we timeout or fill the buffer
            while (running && time(NULL) - start_time < 10 && byte_count < max_length - 1) {
                uint8_t byte = receive_manchester_byte(rx_pin);
                
                // If valid ASCII, add to message
                if ((byte >= 32 && byte <= 126) || byte == '\n' || byte == '\r' || byte == '\t') {
                    message[byte_count++] = (char)byte;
                    
                    if (verbose_mode) {
                        printf("m");
                        fflush(stdout);
                    }
                    
                    if (byte == '\0' || byte == '\n') {
                        break;
                    }
                } else if (byte == 0) {
                    // Possible end of transmission
                    break;
                }
            }
            
            message[byte_count] = '\0'; // Ensure null termination
            return byte_count > 0;
        }
        
        // Short delay before next attempt
        delay_ms(5);
    }
    
    return false;
}

// Print usage instructions
void print_usage(char* program_name) {
    printf("Usage: %s [options]\n", program_name);
    printf("Options:\n");
    printf("  -p PIN    : GPIO pin number for RF receiver (default: %d)\n", RF_RX_PIN);
    printf("  -b BAUD   : Baud rate (default: %d)\n", DEFAULT_BAUD_RATE);
    printf("  -m MODE   : Reception mode (1=Basic, 2=Structured, 3=Manchester, 0=Auto)\n");
    printf("  -d        : Enable debug output\n");
    printf("  -v        : Verbose output\n");
    printf("  -h        : Show this help\n");
}

// Main function
int main(int argc, char *argv[]) {
    int rx_pin = RF_RX_PIN;
    int mode = 0; // Auto by default
    int opt;
    
    // Parse command line arguments
    while ((opt = getopt(argc, argv, "p:b:m:dvh")) != -1) {
        switch (opt) {
            case 'p':
                rx_pin = atoi(optarg);
                break;
            case 'b':
                pulse_length = 1000000 / atoi(optarg);
                break;
            case 'm':
                mode = atoi(optarg);
                break;
            case 'd':
                debug_mode = true;
                break;
            case 'v':
                verbose_mode = true;
                break;
            case 'h':
            default:
                print_usage(argv[0]);
                return (opt == 'h') ? EXIT_SUCCESS : EXIT_FAILURE;
        }
    }
    
    printf("PIC32MX RF 433MHz Receiver (Raspberry Pi)\n");
    printf("----------------------------------------\n");
    printf("RF Receiver Pin: GPIO %d\n", rx_pin);
    printf("Baud Rate: %d bps\n", DEFAULT_BAUD_RATE);
    printf("Mode: %s\n", 
           mode == 1 ? "Basic ASCII" : 
           mode == 2 ? "Structured Protocol" : 
           mode == 3 ? "Manchester Encoding" : "Auto-detect");
    printf("Debug: %s\n", debug_mode ? "Enabled" : "Disabled");
    printf("Press Ctrl+C to exit\n\n");
    
    // Initialize pigpio
    if (gpioInitialise() < 0) {
        fprintf(stderr, "Failed to initialize GPIO\n");
        return EXIT_FAILURE;
    }
    
    // Set up signal handler for Ctrl+C
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    
    // Set up the RF receiver pin
    gpioSetMode(rx_pin, PI_INPUT);
    gpioSetPullUpDown(rx_pin, PI_PUD_DOWN); // Pull-down resistor
    
    char message[MAX_MESSAGE_LEN];
    bool received;
    
    // Main loop
    while (running) {
        switch (mode) {
            case MODE_BASIC_ASCII:
                received = receive_basic_ascii_message(rx_pin, message, MAX_MESSAGE_LEN);
                break;
            case MODE_STRUCTURED_PROTOCOL:
                received = receive_structured_protocol_message(rx_pin, message, MAX_MESSAGE_LEN);
                break;
            case MODE_MANCHESTER_ENCODING:
                received = receive_manchester_message(rx_pin, message, MAX_MESSAGE_LEN);
                break;
            default: // Auto-detect mode
                printf("Trying basic ASCII mode...\n");
                received = receive_basic_ascii_message(rx_pin, message, MAX_MESSAGE_LEN);
                
                if (!received) {
                    printf("Trying structured protocol mode...\n");
                    received = receive_structured_protocol_message(rx_pin, message, MAX_MESSAGE_LEN);
                    
                    if (!received) {
                        printf("Trying Manchester encoding mode...\n");
                        received = receive_manchester_message(rx_pin, message, MAX_MESSAGE_LEN);
                    }
                }
                break;
        }
        
        // Display received message
        if (received && strlen(message) > 0) {
            printf("\n----------------\n");
            printf("Received: '%s'\n", message);
            printf("Length: %zu bytes\n", strlen(message));
            printf("Hex: ");
            for (size_t i = 0; i < strlen(message); i++) {
                printf("%02X ", message[i]);
            }
            printf("\n----------------\n");
        } else {
            if (verbose_mode) {
                printf("No valid message received in this cycle\n");
            }
        }
        
        // Brief delay between reception attempts
        delay_ms(500);
    }
    
    // Cleanup
    gpioTerminate();
    printf("\nGoodbye!\n");
    return EXIT_SUCCESS;
}

// Function prototypes
void delay_us(int microseconds);
void delay_ms(int milliseconds);
void signal_handler(int sig);
bool detect_preamble(int rx_pin);
bool detect_start_symbol(int rx_pin);
uint8_t receive_byte(int rx_pin);
uint8_t receive_manchester_byte(int rx_pin);
uint8_t receive_4to6_encoded_byte(int rx_pin);
uint16_t calculate_crc16(const uint8_t* data, uint8_t length);
bool receive_basic_ascii_message(int rx_pin, char* message, int max_length);
bool receive_structured_protocol_message(int rx_pin, char* message, int max_length);
bool receive_manchester_message(int rx_pin, char* message, int max_length);
void print_usage(char* program_name);

// Remove unused transmit functions since we only have a receiver
// Function to send sync signal - REMOVED (transmitter not connected)
// Function to send a bit - REMOVED (transmitter not connected)
// Function to convert decimal to binary - REMOVED (not needed for receiver only)
=======
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
>>>>>>> dcd7bdc81f56b53a44fe2049b97f49a707a8c7a1

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
