#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <net/if.h>
#include <sys/ioctl.h>
#include <linux/can.h>
#include <linux/can/raw.h>
#include <time.h>
#include <ctype.h>
#include <curl/curl.h>
#include <stdbool.h>
#include <stdint.h>
#include <signal.h>
#include <stdarg.h>  /* For va_start, va_end */
#include <errno.h>   /* For errno */

#define CAN_INTERFACE "can0"
#define TARGET_CAN_ID 0x125  // Environmental sensor data (temperature and humidity)

// InfluxDB configuration
#define INFLUXDB_URL "http://localhost:8086/ping"
#define INFLUXDB_WRITE_URL "http://localhost:8086/api/v2/write?org=13d05bde442bdf3e&bucket=_monitoring&precision=ns"
#define INFLUXDB_TOKEN "8mFEgSzFajMOd-m4fwmad8QbZp1anShIzdjZm3s7yt0ZCIau3It2CU4rCh4v4JK_vcfP8no40aCT-Dk0MLrTwA=="

// Statistics
static unsigned long msg_count = 0;
static unsigned long rx_count = 0;
static unsigned long influx_count = 0;
static unsigned long error_count = 0;

// Control flag for main loop
static volatile bool running = true;

// CURL handle for reuse
static CURL *curl_handle = NULL;
static struct curl_slist *headers = NULL;

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

// Function to print data in both hex and ASCII format (only when needed)
void print_data_readable(const unsigned char *data, int length) {
    if (current_log_level < LOG_DEBUG) {
        return;  // Skip detailed output if not in debug mode
    }
    
    int i;
    
    // Print hex values
    printf("HEX: ");
    for (i = 0; i < length; i++) {
        printf("%02X ", data[i]);
    }
    
    // Print ASCII representation
    printf("| ASCII: ");
    for (i = 0; i < length; i++) {
        if (isprint(data[i])) {
            printf("%c", data[i]);
        } else {
            printf(".");
        }
    }
    
    // Print decimal values
    printf(" | DEC: ");
    for (i = 0; i < length; i++) {
        printf("%3d ", data[i]);
    }
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

bool write_to_influxdb(const struct can_frame *frame) {
    CURLcode res;
    bool write_successful = false;
    static char data[256];  // Static to avoid stack allocations
    static time_t last_write_time = 0;
    time_t current_time;
    
    // Rate limit writes to InfluxDB (max once per second)
    time(&current_time);
    if (current_time - last_write_time < 1) {
        return true;  // Skip but don't count as error
    }
    last_write_time = current_time;
    
    // Extract temperature and humidity values
    uint32_t tempBits = 
        ((uint32_t)frame->data[0] << 24) | 
        ((uint32_t)frame->data[1] << 16) | 
        ((uint32_t)frame->data[2] << 8) | 
        (uint32_t)frame->data[3];
    
    uint32_t humidBits = 
        ((uint32_t)frame->data[4] << 24) | 
        ((uint32_t)frame->data[5] << 16) | 
        ((uint32_t)frame->data[6] << 8) | 
        (uint32_t)frame->data[7];
    
    float temperature, humidity;
    memcpy(&temperature, &tempBits, 4);
    memcpy(&humidity, &humidBits, 4);
    
    log_message(LOG_DEBUG, "Extracted values - Temperature: %.2f, Humidity: %.2f", temperature, humidity);
    
    // Create InfluxDB line protocol format
    snprintf(data, sizeof(data), "Environment,can_id=0x%03X temperature=%.2f,humidity=%.2f", 
             frame->can_id, temperature, humidity);
    
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
            log_message(LOG_DEBUG, "Written CAN data to InfluxDB");
        } else {
            log_message(LOG_ERROR, "Failed to write to InfluxDB: HTTP code %ld", response_code);
        }
    } else {
        log_message(LOG_ERROR, "Failed to write to InfluxDB: %s", curl_easy_strerror(res));
    }

    return write_successful;
}

// Extract and process temperature and humidity data
void process_environmental_data(const struct can_frame *frame) {
    if (frame->can_dlc != 8) {
        log_message(LOG_WARNING, "Expected 8 bytes of data but received %d bytes", frame->can_dlc);
        return;
    }
    
    // Extract temperature and humidity values
    uint32_t tempBits = 
        ((uint32_t)frame->data[0] << 24) | 
        ((uint32_t)frame->data[1] << 16) | 
        ((uint32_t)frame->data[2] << 8) | 
        (uint32_t)frame->data[3];
    
    uint32_t humidBits = 
        ((uint32_t)frame->data[4] << 24) | 
        ((uint32_t)frame->data[5] << 16) | 
        ((uint32_t)frame->data[6] << 8) | 
        (uint32_t)frame->data[7];
    
    float temp, hum;
    memcpy(&temp, &tempBits, 4);
    memcpy(&hum, &humidBits, 4);
    
    log_message(LOG_INFO, "Temperature: %.2f°C, Humidity: %.2f%%", temp, hum);
    
    // Write to InfluxDB
    if (write_to_influxdb(frame)) {
        influx_count++;
    } else {
        error_count++;
    }
}

// Print statistics
void print_statistics() {
    log_message(LOG_INFO, "--- Statistics Update ---");
    log_message(LOG_INFO, "Total Messages Sent: %lu", msg_count);
    log_message(LOG_INFO, "Total Messages Received: %lu", rx_count);
    log_message(LOG_INFO, "Total Messages Sent to InfluxDB: %lu", influx_count);
    log_message(LOG_INFO, "Total Errors: %lu", error_count);
    
    float can_success = (rx_count > 0 && msg_count > 0) ? ((float)rx_count / msg_count * 100) : 0;
    float influx_success = (influx_count > 0 && rx_count > 0) ? ((float)influx_count / rx_count * 100) : 0;
    
    log_message(LOG_INFO, "CAN Success Rate: %.1f%%", can_success);
    log_message(LOG_INFO, "InfluxDB Success Rate: %.1f%%", influx_success);
}

int main(void) {
    int socket_fd;
    struct sockaddr_can addr;
    struct ifreq ifr;
    struct can_frame send_frame;
    struct can_frame recv_frame;
    int nbytes;
    time_t last_stats_time = 0;
    time_t current_time;
    struct timeval timeout;
    int select_result;
    fd_set read_fds;
    
    // Set up signal handling for graceful termination
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);
    
    log_message(LOG_INFO, "Starting CAN-to-InfluxDB application...");

    // Initialize CURL globally
    curl_global_init(CURL_GLOBAL_DEFAULT);  // Use DEFAULT instead of ALL to reduce overhead
    
    // Initialize CURL resources
    if (!init_curl_resources()) {
        log_message(LOG_ERROR, "Failed to initialize CURL resources");
        curl_global_cleanup();
        return EXIT_FAILURE;
    }
    
    // Test InfluxDB connection
    if (!test_influxdb_connection()) {
        log_message(LOG_ERROR, "Failed to connect to InfluxDB. Exiting application");
        cleanup_curl_resources();
        curl_global_cleanup();
        return EXIT_FAILURE;
    }

    // Open the CAN socket
    log_message(LOG_INFO, "Creating CAN socket...");
    socket_fd = socket(PF_CAN, SOCK_RAW, CAN_RAW);
    if (socket_fd < 0) {
        log_message(LOG_ERROR, "Socket creation failed: %s", strerror(errno));
        cleanup_curl_resources();
        curl_global_cleanup();
        return EXIT_FAILURE;
    }
    
    // Get interface index
    strcpy(ifr.ifr_name, CAN_INTERFACE);
    if (ioctl(socket_fd, SIOCGIFINDEX, &ifr) < 0) {
        log_message(LOG_ERROR, "Failed to get interface index: %s", strerror(errno));
        close(socket_fd);
        cleanup_curl_resources();
        curl_global_cleanup();
        return EXIT_FAILURE;
    }

    // Bind the socket
    addr.can_family = AF_CAN;
    addr.can_ifindex = ifr.ifr_ifindex;
    if (bind(socket_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        log_message(LOG_ERROR, "Socket binding failed: %s", strerror(errno));
        close(socket_fd);
        cleanup_curl_resources();
        curl_global_cleanup();
        return EXIT_FAILURE;
    }
    
    // Setup filter to only receive messages with TARGET_CAN_ID
    struct can_filter filter[1];
    filter[0].can_id = TARGET_CAN_ID;
    filter[0].can_mask = CAN_SFF_MASK;
    if (setsockopt(socket_fd, SOL_CAN_RAW, CAN_RAW_FILTER, &filter, sizeof(filter)) < 0) {
        log_message(LOG_WARNING, "Failed to set CAN filter: %s", strerror(errno));
        // Continue anyway, we'll filter in software
    }

    // Initialize transmission frame
    send_frame.can_id = 0x123;  // Set ID to 0x123
    send_frame.can_dlc = 8;     // Data length = 8 bytes
    send_frame.data[0] = 'R';
    send_frame.data[1] = 'P';
    send_frame.data[2] = '3';
    send_frame.data[3] = ' ';
    send_frame.data[4] = 'C';
    send_frame.data[5] = 'A';
    send_frame.data[6] = 'N';
    send_frame.data[7] = 0x00;  // Counter starts at 0

    log_message(LOG_INFO, "CAN communication initialized successfully");
    log_message(LOG_INFO, "Starting main communication loop...");

    // Main loop - send and receive messages
    while (running) {
        // Send a CAN message (once per second)
        if (write(socket_fd, &send_frame, sizeof(struct can_frame)) != sizeof(struct can_frame)) {
            log_message(LOG_ERROR, "Message transmission failed: %s", strerror(errno));
            error_count++;
        } else {
            msg_count++;
            if (current_log_level >= LOG_DEBUG) {
                log_message(LOG_DEBUG, "TX [%03X] ", send_frame.can_id);
                print_data_readable(send_frame.data, send_frame.can_dlc);
            }
        }

        send_frame.data[7]++;  // Increment the counter

        // Set up for select() with timeout
        FD_ZERO(&read_fds);
        FD_SET(socket_fd, &read_fds);
        
        // Set timeout to 500ms (more responsive than 1s for signal handling)
        timeout.tv_sec = 0;
        timeout.tv_usec = 500000;
        
        // Wait for socket to become readable or timeout
        select_result = select(socket_fd + 1, &read_fds, NULL, NULL, &timeout);
        
        if (select_result > 0 && FD_ISSET(socket_fd, &read_fds)) {
            // Socket is readable, receive message
            nbytes = read(socket_fd, &recv_frame, sizeof(struct can_frame));
            if (nbytes > 0) {
                rx_count++;
                
                // Only process messages with the target ID
                if (recv_frame.can_id == TARGET_CAN_ID) {
                    if (current_log_level >= LOG_DEBUG) {
                        log_message(LOG_DEBUG, "RX [%03X] ", recv_frame.can_id);
                        print_data_readable(recv_frame.data, recv_frame.can_dlc);
                    }
                    
                    // Process environmental data
                    process_environmental_data(&recv_frame);
                }
            } else if (nbytes < 0) {
                log_message(LOG_ERROR, "Message reception failed: %s", strerror(errno));
                error_count++;
            }
        } else if (select_result < 0) {
            // Error in select
            log_message(LOG_ERROR, "Select failed: %s", strerror(errno));
            error_count++;
        }

        // Print statistics once per minute
        time(&current_time);
        if (current_time - last_stats_time >= 60) {
            print_statistics();
            last_stats_time = current_time;
        }
    }

    // Clean up resources
    log_message(LOG_INFO, "Shutting down...");
    close(socket_fd);
    cleanup_curl_resources();
    curl_global_cleanup();
    
    // Final statistics
    print_statistics();
    log_message(LOG_INFO, "Application terminated successfully");
    
    return EXIT_SUCCESS;
}
