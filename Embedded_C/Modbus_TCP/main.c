#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <stdbool.h>
#include <errno.h>
#include <time.h>
#include <curl/curl.h>
#include <stdint.h>
#include <stdarg.h>
#include <signal.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <netinet/in.h>

// Configuration
#define MODBUS_TCP_IP "192.168.18.4"  // IP address of Modbus TCP device
#define MODBUS_TCP_PORT 502           // Standard Modbus TCP port
#define SLAVE_ID 3                    // ESP32 Modbus slave ID

// Buffer size
#define MAX_BUFFER_SIZE 256

// Function codes
#define FUNC_READ_INPUT 0x04

// Register addresses
#define REG_TEMPERATURE 0    // Input register 0 for temperature (×10)
#define REG_HUMIDITY    1    // Input register 1 for humidity (×10)

// InfluxDB configuration
#define INFLUXDB_URL "http://localhost:8086/ping"
#define INFLUXDB_WRITE_URL "http://localhost:8086/api/v2/write?org=13d05bde442bdf3e&bucket=_monitoring&precision=ns"
#define INFLUXDB_TOKEN "8mFEgSzFajMOd-m4fwmad8QbZp1anShIzdjZm3s7yt0ZCIau3It2CU4rCh4v4JK_vcfP8no40aCT-Dk0MLrTwA=="

// Statistics
static unsigned long modbus_queries = 0;
static unsigned long modbus_replies = 0;
static unsigned long influx_writes = 0;
static unsigned long error_count = 0;

// Control flag for main loop
static volatile bool running = true;

// CURL handle for reuse
static CURL *curl_handle = NULL;
static struct curl_slist *headers = NULL;

// Temperature and humidity variables
static float last_tcp_temperature = 0.0;
static float last_tcp_humidity = 0.0;
static time_t last_tcp_read = 0;

// Log levels
typedef enum {
    LOG_ERROR,
    LOG_WARNING,
    LOG_INFO,
    LOG_DEBUG
} LogLevel;

// Current log level
static LogLevel current_log_level = LOG_INFO;

// Signal handler for graceful termination
void handle_signal(int signal) {
    running = false;
}

// Function to delay milliseconds
void delay_ms(int milliseconds) {
    struct timespec ts;
    ts.tv_sec = milliseconds / 1000;
    ts.tv_nsec = (milliseconds % 1000) * 1000000;
    nanosleep(&ts, NULL);
}

// Callback function to handle response from InfluxDB
size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    // We don't need to process the response, just return bytes received
    return size * nmemb;
}

// Print timestamp and log message based on log level
void log_message(LogLevel level, const char *format, ...) {
    // Skip if log level is higher than current setting
    if (level > current_log_level) {
        return;
    }

    // Get current time
    time_t now;
    struct tm *tm_info;
    char timestamp[20];
    
    time(&now);
    tm_info = localtime(&now);
    strftime(timestamp, 20, "%H:%M:%S", tm_info);
    
    // Print timestamp and log level prefix
    const char *prefix;
    switch (level) {
        case LOG_ERROR:   prefix = "[ERROR] "; break;
        case LOG_WARNING: prefix = "[WARN]  "; break;
        case LOG_INFO:    prefix = "[INFO]  "; break;
        case LOG_DEBUG:   prefix = "[DEBUG] "; break;
        default:          prefix = "[LOG]   "; break;
    }
    
    printf("[%s] %s", timestamp, prefix);
    
    // Print the actual message with variable arguments
    va_list args;
    va_start(args, format);
    vprintf(format, args);
    va_end(args);
    
    printf("\n");
}

// Function to print buffer in hex format
void print_hex_buffer(const unsigned char *buffer, int length) {
    printf("HEX: ");
    for (int i = 0; i < length; i++) {
        printf("%02X ", buffer[i]);
    }
    printf("\n");
}

// Initialize CURL resources once for reuse
bool init_curl_resources() {
    // Initialize the curl handle
    curl_handle = curl_easy_init();
    if (!curl_handle) {
        log_message(LOG_ERROR, "Failed to initialize CURL");
        return false;
    }
    
    // Set up headers once
    char auth_header[256];
    snprintf(auth_header, sizeof(auth_header), "Authorization: Token %s", INFLUXDB_TOKEN);
    headers = curl_slist_append(NULL, auth_header);
    headers = curl_slist_append(headers, "Content-Type: text/plain; charset=utf-8");
    
    return true;
}

// Clean up CURL resources
void cleanup_curl_resources() {
    if (headers) {
        curl_slist_free_all(headers);
        headers = NULL;
    }
    
    if (curl_handle) {
        curl_easy_cleanup(curl_handle);
        curl_handle = NULL;
    }
}

// Test connection to InfluxDB
bool test_influxdb_connection() {
    CURLcode res;
    bool connection_successful = false;
    long response_code;

    log_message(LOG_INFO, "Testing connection to InfluxDB...");
    
    // Reset handle for fresh configuration
    curl_easy_reset(curl_handle);
    
    // Set URL
    curl_easy_setopt(curl_handle, CURLOPT_URL, INFLUXDB_URL);
    
    // Set callback function
    curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, write_callback);
    
    // Set timeout to prevent hanging
    curl_easy_setopt(curl_handle, CURLOPT_TIMEOUT, 5L);
    
    // Perform request
    res = curl_easy_perform(curl_handle);

    // Check for errors
    if (res != CURLE_OK) {
        log_message(LOG_ERROR, "Connection failed: %s", curl_easy_strerror(res));
    } else {
        // Get HTTP response code
        curl_easy_getinfo(curl_handle, CURLINFO_RESPONSE_CODE, &response_code);
        
        if (response_code == 204) {  // InfluxDB returns 204 for successful ping
            log_message(LOG_INFO, "Successfully connected to InfluxDB");
            connection_successful = true;
        } else {
            log_message(LOG_ERROR, "Unexpected response code: %ld (expected 204)", response_code);
        }
    }

    return connection_successful;
}

// Write temperature and humidity data to InfluxDB
bool write_to_influxdb(float temperature, float humidity) {
    CURLcode res;
    bool write_successful = false;
    static char data[256];  // Static to avoid stack allocations
    
    log_message(LOG_DEBUG, "Writing to InfluxDB - Temperature: %.2f, Humidity: %.2f", 
                temperature, humidity);
    
    // Create InfluxDB line protocol format with source tag
    // Format: measurement,tag_set field_set timestamp
    snprintf(data, sizeof(data), "environment,sensor=ESP32,source=Modbus_TCP temperature=%.2f,humidity=%.2f", 
             temperature, humidity);
    
    // Reset handle for fresh configuration
    curl_easy_reset(curl_handle);
    
    // Set URL and headers
    curl_easy_setopt(curl_handle, CURLOPT_URL, INFLUXDB_WRITE_URL);
    curl_easy_setopt(curl_handle, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl_handle, CURLOPT_POST, 1L);
    curl_easy_setopt(curl_handle, CURLOPT_POSTFIELDS, data);
    curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl_handle, CURLOPT_TIMEOUT, 3L); // Set a timeout to prevent hanging

    // Perform request
    res = curl_easy_perform(curl_handle);

    if (res == CURLE_OK) {
        long response_code;
        curl_easy_getinfo(curl_handle, CURLINFO_RESPONSE_CODE, &response_code);
        if (response_code == 204) {
            write_successful = true;
            log_message(LOG_INFO, "Successfully wrote data to InfluxDB");
        } else {
            log_message(LOG_ERROR, "Failed to write to InfluxDB: HTTP code %ld", response_code);
        }
    } else {
        log_message(LOG_ERROR, "Failed to write to InfluxDB: %s", curl_easy_strerror(res));
    }

    return write_successful;
}

// Create a Modbus TCP connection
int create_modbus_tcp_connection() {
    int sock;
    struct sockaddr_in server;
    
    // Create socket
    sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock == -1) {
        log_message(LOG_ERROR, "Could not create socket: %s", strerror(errno));
        return -1;
    }
    
    // Set socket timeout
    struct timeval timeout;
    timeout.tv_sec = 5;
    timeout.tv_usec = 0;
    setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, (char *)&timeout, sizeof(timeout));
    setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, (char *)&timeout, sizeof(timeout));
    
    // Prepare the sockaddr_in structure
    server.sin_family = AF_INET;
    server.sin_addr.s_addr = inet_addr(MODBUS_TCP_IP);
    server.sin_port = htons(MODBUS_TCP_PORT);
    
    // Connect to Modbus TCP server
    if (connect(sock, (struct sockaddr *)&server, sizeof(server)) < 0) {
        log_message(LOG_ERROR, "Connect failed: %s", strerror(errno));
        close(sock);
        return -1;
    }
    
    log_message(LOG_INFO, "Connected to Modbus TCP server at %s:%d", MODBUS_TCP_IP, MODBUS_TCP_PORT);
    return sock;
}

// Create and send a Modbus TCP request
bool send_modbus_tcp_request(int socket, uint8_t unit_id, uint8_t function_code, 
                           uint16_t start_address, uint16_t quantity, 
                           uint8_t *response, size_t *response_length) {
    uint8_t request[12];  // MBAP header (7 bytes) + PDU (5 bytes)
    uint16_t transaction_id = 1;  // Transaction identifier
    
    // Build the MBAP header
    request[0] = (transaction_id >> 8) & 0xFF;  // Transaction ID high byte
    request[1] = transaction_id & 0xFF;         // Transaction ID low byte
    request[2] = 0x00;                          // Protocol ID high byte
    request[3] = 0x00;                          // Protocol ID low byte
    request[4] = 0x00;                          // Length high byte
    request[5] = 0x06;                          // Length low byte (6 bytes to follow)
    request[6] = unit_id;                       // Unit ID
    
    // Build the PDU
    request[7] = function_code;                 // Function code
    request[8] = (start_address >> 8) & 0xFF;   // Start address high byte
    request[9] = start_address & 0xFF;          // Start address low byte
    request[10] = (quantity >> 8) & 0xFF;       // Quantity high byte
    request[11] = quantity & 0xFF;              // Quantity low byte
    
    log_message(LOG_DEBUG, "Sending Modbus TCP request:");
    print_hex_buffer(request, 12);
    
    // Send the request
    if (send(socket, request, 12, 0) != 12) {
        log_message(LOG_ERROR, "Send failed: %s", strerror(errno));
        return false;
    }
    
    modbus_queries++;
    
    // Receive the response
    int bytes_received = recv(socket, response, MAX_BUFFER_SIZE, 0);
    if (bytes_received <= 0) {
        log_message(LOG_ERROR, "Receive failed: %s", strerror(errno));
        return false;
    }
    
    *response_length = bytes_received;
    
    log_message(LOG_DEBUG, "Received Modbus TCP response (%d bytes):", bytes_received);
    print_hex_buffer(response, bytes_received);
    
    // Check if the response is valid
    if (bytes_received < 9) {  // MBAP header (7 bytes) + function code (1 byte) + byte count (1 byte)
        log_message(LOG_ERROR, "Response too short");
        return false;
    }
    
    // Check if the unit ID and function code match
    if (response[6] != unit_id || response[7] != function_code) {
        log_message(LOG_ERROR, "Invalid response (unit ID or function code mismatch)");
        return false;
    }
    
    modbus_replies++;
    return true;
}

// Send a read input registers request (Function 0x04)
bool read_input_registers(int socket, uint16_t start_address, uint16_t quantity, 
                         uint16_t *registers, size_t *registers_count) {
    uint8_t response[MAX_BUFFER_SIZE];
    size_t response_length = 0;
    
    // Send the request
    if (!send_modbus_tcp_request(socket, SLAVE_ID, FUNC_READ_INPUT, 
                              start_address, quantity, response, &response_length)) {
        return false;
    }
    
    // Parse the response - get byte count
    uint8_t byte_count = response[8];
    
    // Check if we received the expected number of bytes
    if (response_length < 9 + byte_count) {
        log_message(LOG_ERROR, "Incomplete response data");
        return false;
    }
    
    // The number of registers we received
    *registers_count = byte_count / 2;
    
    // Extract the register values
    for (size_t i = 0; i < *registers_count; i++) {
        registers[i] = (response[9 + i * 2] << 8) | response[10 + i * 2];
    }
    
    return true;
}

// Read temperature and humidity via Modbus TCP
bool read_temperature_humidity_tcp(int socket, float *temperature, float *humidity) {
    uint16_t registers[2];  // To store the raw register values
    size_t registers_count = 0;
    
    // Read two input registers starting at address 0
    if (!read_input_registers(socket, REG_TEMPERATURE, 2, registers, &registers_count)) {
        log_message(LOG_ERROR, "Failed to read temperature and humidity registers");
        return false;
    }
    
    // Check if we received the expected number of registers
    if (registers_count != 2) {
        log_message(LOG_ERROR, "Received unexpected number of registers: %zu (expected 2)", registers_count);
        return false;
    }
    
    // Convert raw values to temperature and humidity (divide by 10)
    *temperature = registers[0] / 10.0f;
    *humidity = registers[1] / 10.0f;
    
    log_message(LOG_INFO, "Read values - Temperature: %.1f°C, Humidity: %.1f%%", 
               *temperature, *humidity);
    
    // Check for valid range
    if (*temperature < -40.0 || *temperature > 85.0 || 
        *humidity < 0.0 || *humidity > 100.0) {
        log_message(LOG_WARNING, "Values out of valid range");
        return false;
    }
    
    return true;
}

// Print statistics
void print_statistics() {
    log_message(LOG_INFO, "--- Statistics Update ---");
    log_message(LOG_INFO, "Modbus TCP Queries Sent: %lu", modbus_queries);
    log_message(LOG_INFO, "Modbus TCP Replies Received: %lu", modbus_replies);
    log_message(LOG_INFO, "InfluxDB Writes: %lu", influx_writes);
    log_message(LOG_INFO, "Errors: %lu", error_count);
    
    float modbus_success = (modbus_replies > 0 && modbus_queries > 0) ? 
                           ((float)modbus_replies / modbus_queries * 100) : 0;
    
    log_message(LOG_INFO, "Modbus TCP Success Rate: %.1f%%", modbus_success);
    
    log_message(LOG_INFO, "Last TCP Temperature: %.2f°C", last_tcp_temperature);
    log_message(LOG_INFO, "Last TCP Humidity: %.2f%%", last_tcp_humidity);
    
    // Get formatted timestamp of last successful read
    char tcp_time_buffer[30];
    struct tm *tm_info;
    
    if (last_tcp_read > 0) {
        tm_info = localtime(&last_tcp_read);
        strftime(tcp_time_buffer, 30, "%Y-%m-%d %H:%M:%S", tm_info);
        log_message(LOG_INFO, "Last Successful TCP Read: %s", tcp_time_buffer);
    }
}

int main(void) {
    int modbus_socket;
    time_t last_stats_time = 0;
    time_t current_time;
    float temperature, humidity;
    
    // Set up signal handling for graceful termination
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);
    
    log_message(LOG_INFO, "Starting ESP32 Modbus TCP Monitor...");
    log_message(LOG_INFO, "Press Ctrl+C to exit");
    
    // Initialize CURL globally
    curl_global_init(CURL_GLOBAL_DEFAULT);
    
    // Initialize CURL resources
    if (!init_curl_resources()) {
        log_message(LOG_ERROR, "Failed to initialize CURL resources");
        curl_global_cleanup();
        return EXIT_FAILURE;
    }
    
    // Test InfluxDB connection
    if (!test_influxdb_connection()) {
        log_message(LOG_WARNING, "Failed to connect to InfluxDB. Will continue but data won't be stored.");
    }
    
    // Main loop
    while (running) {
        // Create a new Modbus TCP connection
        modbus_socket = create_modbus_tcp_connection();
        if (modbus_socket < 0) {
            log_message(LOG_ERROR, "Failed to connect to Modbus TCP server, retrying in 5 seconds...");
            error_count++;
            sleep(5);
            continue;
        }
        
        // Read temperature and humidity
        if (read_temperature_humidity_tcp(modbus_socket, &temperature, &humidity)) {
            // Update last successful values
            last_tcp_temperature = temperature;
            last_tcp_humidity = humidity;
            time(&last_tcp_read);
            
            // Write to InfluxDB
            if (write_to_influxdb(temperature, humidity)) {
                influx_writes++;
            } else {
                error_count++;
            }
        }
        
        // Close the connection
        close(modbus_socket);
        
        // Print statistics once per minute
        time(&current_time);
        if (current_time - last_stats_time >= 60) {
            print_statistics();
            last_stats_time = current_time;
        }
        
        // Short delay between iterations
        sleep(1);
    }
    
    // Clean up
    log_message(LOG_INFO, "Shutting down...");
    cleanup_curl_resources();
    curl_global_cleanup();
    
    // Final statistics
    print_statistics();
    log_message(LOG_INFO, "Monitor terminated successfully");
    
    return EXIT_SUCCESS;
}
