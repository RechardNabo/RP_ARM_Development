#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#include <stdbool.h>
#include <errno.h>
#include <time.h>
#include <curl/curl.h>
#include <stdint.h>
#include <stdarg.h>
#include <signal.h>
#include <pigpio.h>
#include <net/if.h>
#include <sys/ioctl.h>
#include <linux/can.h>
#include <linux/can/raw.h>
#include "../CAN_bus.h"  // Include extended CAN ID protocol definitions
#include <libmongoc-1.0/mongoc.h>
#include <libbson-1.0/bson.h>

// Function declarations
typedef enum {
    LOG_ERROR,
    LOG_WARNING,
    LOG_INFO,
    LOG_DEBUG
} LogLevel;

void log_message(LogLevel level, const char *format, ...);
bool init_curl_resources();
void cleanup_curl_resources();
void cleanup_resources();
void update_device_activity(uint8_t device_id, const char *device_type);
void check_device_status();
void update_device_status_in_mongodb(uint8_t device_id, bool is_active);
void save_device_info_to_mongodb(uint8_t device_id, const char *device_type);
void print_device_statistics();

// Configuration
#define SERIAL_PORT "/dev/ttyAMA0"  // UART port on RPi
#define BAUD_RATE B9600             // Standard baud rate
#define SLAVE_ID 3                  // ESP32 Modbus slave ID
#define CAN_INTERFACE "can0"        // CAN interface name

// CAN message IDs using extended CAN ID protocol
// Legacy plain CAN IDs for backward compatibility
#define TARGET_CAN_ID_LEGACY 0x125         // Environmental sensor data (temperature and humidity)
#define VOLTAGE_CAN_ID_LEGACY 0x126        // Resistor voltage data
#define CURRENT_CAN_ID_LEGACY 0x127        // Resistor current data
#define POWER_CAN_ID_LEGACY 0x128          // Resistor power data

// Extended CAN IDs using the protocol defined in CAN bus.h
// Using source ID 0x01 (this device), destination broadcast (0xFF), and appropriate message types
#define TARGET_CAN_ID MAKE_EXTENDED_CAN_ID(PRIORITY_SENSOR_DATA, 0x01, EXT_DEST_BROADCAST, MSG_ENV_HUMIDITY)
#define VOLTAGE_CAN_ID MAKE_EXTENDED_CAN_ID(PRIORITY_SENSOR_DATA, 0x01, EXT_DEST_BROADCAST, MSG_ELECTRICAL_DC_VOLTAGE)
#define CURRENT_CAN_ID MAKE_EXTENDED_CAN_ID(PRIORITY_SENSOR_DATA, 0x01, EXT_DEST_BROADCAST, MSG_ELECTRICAL_DC_CURRENT)
#define POWER_CAN_ID MAKE_EXTENDED_CAN_ID(PRIORITY_SENSOR_DATA, 0x01, EXT_DEST_BROADCAST, MSG_ELECTRICAL_ACTIVE_POWER)
#define ARCHITECTURE_CAN_ID MAKE_EXTENDED_CAN_ID(PRIORITY_SENSOR_DATA, 0x01, EXT_DEST_BROADCAST, MSG_ARCHITECTURE_ID)

// CAN message types in extended CAN ID
#define MSG_ARCHITECTURE_ID        0x01
#define MSG_TEMP_AMBIENT          0x20
#define MSG_ENV_HUMIDITY          0x50
#define MSG_ELECTRICAL_DC_VOLTAGE 0x80
#define MSG_ELECTRICAL_DC_CURRENT 0x82
#define MSG_ELECTRICAL_ACTIVE_POWER 0x84

// RS485 control
#define SERIAL_COMMUNICATION_CONTROL_PIN 21  // DE/RE pin for RS485 module
#define RS485_TX_PIN_VALUE 1                // HIGH for transmit
#define RS485_RX_PIN_VALUE 0                // LOW for receive

// Buffer size
#define MAX_BUFFER_SIZE 256

// Function codes
#define FUNC_READ_INPUT           0x04

// Register addresses
#define REG_TEMPERATURE           0    // Input register 0 for temperature (×10)
#define REG_HUMIDITY              1    // Input register 1 for humidity (×10)
#define REG_VOLTAGE_R1            2    // Input register 2 for voltage across R1 (×1000)
#define REG_VOLTAGE_R2            3    // Input register 3 for voltage across R2 (×1000)
#define REG_VOLTAGE_R3            4    // Input register 4 for voltage across R3 (×1000)
#define REG_CURRENT               5    // Input register 5 for circuit current (×1000)
#define REG_POWER_R1              6    // Input register 6 for power in R1 (×1000)
#define REG_POWER_R2              7    // Input register 7 for power in R2 (×1000)
#define REG_POWER_R3              8    // Input register 8 for power in R3 (×1000)

// InfluxDB configuration
#define INFLUXDB_URL "http://localhost:8086/ping"
#define INFLUXDB_WRITE_URL "http://localhost:8086/api/v2/write?org=9433a3d38dc34293&bucket=_monitoring&precision=ns"
#define INFLUXDB_TOKEN "1XlVsaw2ko-fG0TGccLNKi3IfQ6tst9zMGglcUQCMrnJ-5--KkxpxLIWIWtYH8XbSWTyTxQSI32Bv9zByKr_ag=="

// Statistics
static unsigned long modbus_queries = 0;
static unsigned long modbus_replies = 0;
static unsigned long can_messages = 0;
static unsigned long influx_writes = 0;
static unsigned long error_count = 0;

// Control flag for main loop
static volatile bool running = true;

// CURL handle for reuse
static CURL *curl_handle = NULL;
static struct curl_slist *headers = NULL;

// MongoDB connection variables
static mongoc_client_t *mongo_client = NULL;
static mongoc_database_t *database = NULL;
static mongoc_collection_t *devices_collection = NULL;
static mongoc_collection_t *sensors_collection = NULL;

// Device status tracking
#define DEVICE_TIMEOUT_SECONDS 60  // Time after which device is considered inactive
struct DeviceStatus {
    uint8_t device_id;
    time_t last_activity;
    bool is_active;
    char device_type[32];
};

#define MAX_TRACKED_DEVICES 10
static struct DeviceStatus tracked_devices[MAX_TRACKED_DEVICES];
static int num_tracked_devices = 0;
static time_t last_device_status_check = 0;

// Temperature and humidity variables
static float last_rtu_temperature = 0.0;
static float last_rtu_humidity = 0.0;
static float last_can_temperature = 0.0;
static float last_can_humidity = 0.0;
static time_t last_rtu_read = 0;
static time_t last_can_read = 0;

// Resistor measurement variables from CAN
static float last_voltage_r1 = 0.0;
static float last_voltage_r2 = 0.0;
static float last_voltage_r3 = 0.0;
static float last_current = 0.0;
static float last_power_r1 = 0.0;
static float last_power_r2 = 0.0;
static float last_power_r3 = 0.0;
static time_t last_voltage_read = 0;
static time_t last_current_read = 0;
static time_t last_power_read = 0;

// Resistor measurement variables from RTU
static float last_rtu_voltage_r1 = 0.0;
static float last_rtu_voltage_r2 = 0.0;
static float last_rtu_voltage_r3 = 0.0;
static float last_rtu_current = 0.0;
static float last_rtu_power_r1 = 0.0;
static float last_rtu_power_r2 = 0.0;
static float last_rtu_power_r3 = 0.0;

// Log levels already defined in the forward declarations

// Current log level
static LogLevel current_log_level = LOG_INFO;

void update_device_activity(uint8_t device_id, const char *device_type) {
    time_t now;
    time(&now);
    int i;
    bool found = false;
    
    // Look for existing device in our tracking array
    for (i = 0; i < num_tracked_devices; i++) {
        if (tracked_devices[i].device_id == device_id) {
            // Update existing device
            tracked_devices[i].last_activity = now;
            tracked_devices[i].is_active = true;
            found = true;
            break;
        }
    }
    
    // If device not found and we have space, add it
    if (!found && num_tracked_devices < MAX_TRACKED_DEVICES) {
        tracked_devices[num_tracked_devices].device_id = device_id;
        tracked_devices[num_tracked_devices].last_activity = now;
        tracked_devices[num_tracked_devices].is_active = true;
        strncpy(tracked_devices[num_tracked_devices].device_type, device_type, sizeof(tracked_devices[num_tracked_devices].device_type) - 1);
        tracked_devices[num_tracked_devices].device_type[sizeof(tracked_devices[num_tracked_devices].device_type) - 1] = '\0';
        num_tracked_devices++;
    }
}

void check_device_status() {
    time_t now;
    time(&now);
    int i;
    
    for (i = 0; i < num_tracked_devices; i++) {
        // If device hasn't sent data within DEVICE_TIMEOUT_SECONDS, mark as inactive
        bool previous_status = tracked_devices[i].is_active;
        if (now - tracked_devices[i].last_activity > DEVICE_TIMEOUT_SECONDS) {
            tracked_devices[i].is_active = false;
        }
        
        // If status changed, update MongoDB
        if (previous_status != tracked_devices[i].is_active) {
            update_device_status_in_mongodb(tracked_devices[i].device_id, tracked_devices[i].is_active);
        }
    }
    
    last_device_status_check = now;
}

void update_device_status_in_mongodb(uint8_t device_id, bool is_active) {
    if (!mongo_client || !devices_collection) {
        log_message(LOG_ERROR, "MongoDB client not initialized");
        return;
    }
    
    bson_error_t error;
    bson_t *doc;
    bson_t *query;
    char id_str[3];
    
    // Format device ID as hex string
    sprintf(id_str, "%02X", device_id);
    
    // Create query to find this device
    query = bson_new();
    BSON_APPEND_UTF8(query, "device_id", id_str);
    
    // Create update document
    bson_t *update = bson_new();
    BSON_APPEND_BOOL(update, "status", is_active);
    
    doc = bson_new();
    BSON_APPEND_DOCUMENT(doc, "$set", update);
    
    // Update the device status
    if (!mongoc_collection_update_one(devices_collection, query, doc, NULL, NULL, &error)) {
        log_message(LOG_ERROR, "MongoDB status update error: %s", error.message);
    } else {
        log_message(LOG_INFO, "Device %s status updated to %s", id_str, is_active ? "active" : "inactive");
    }
    
    bson_destroy(update);
    bson_destroy(doc);
    bson_destroy(query);
}

// Print device statistics
void print_device_statistics() {
    if (!mongo_client || !devices_collection) {
        log_message(LOG_ERROR, "MongoDB client not initialized");
        return;
    }
    
    int i;
    log_message(LOG_INFO, "==== Device Status ====");
    
    for (i = 0; i < num_tracked_devices; i++) {
        char device_id_str[3];
        sprintf(device_id_str, "%02X", tracked_devices[i].device_id);
        
        // Get time since last activity
        time_t now;
        time(&now);
        long seconds_since_activity = now - tracked_devices[i].last_activity;
        
        log_message(LOG_INFO, "Device %s (%s): %s (Last seen: %ld seconds ago)", 
                  device_id_str,
                  tracked_devices[i].device_type,
                  tracked_devices[i].is_active ? "ACTIVE" : "INACTIVE",
                  seconds_since_activity);
    }
}

// Save device information to MongoDB
void save_device_info_to_mongodb(uint8_t device_id, const char *device_type) {
    if (!mongo_client || !devices_collection) {
        log_message(LOG_ERROR, "MongoDB client not initialized");
        return;
    }
    
    // Update device activity tracking
    update_device_activity(device_id, device_type);
    
    bson_error_t error;
    bson_t *doc;
    bson_t *query;
    char id_str[3];
    time_t now;
    char hostname[256];
    
    // Get current time
    time(&now);
    
    // Get hostname for collector identification
    gethostname(hostname, sizeof(hostname));
    
    // Create query to check if this device already exists
    sprintf(id_str, "%02X", device_id);
    query = bson_new();
    BSON_APPEND_UTF8(query, "device_id", id_str);
    
    // Check if device exists
    int64_t count = mongoc_collection_count_documents(
        devices_collection, query, NULL, NULL, NULL, &error);
    
    if (count < 0) {
        log_message(LOG_ERROR, "MongoDB count error: %s", error.message);
        bson_destroy(query);
        return;
    }
    
    // If device doesn't exist, insert it
    if (count == 0) {
        log_message(LOG_INFO, "Adding new device %s (%s) to MongoDB", id_str, device_type);
        
        // Format timestamp
        char timestamp[30];
        strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", localtime(&now));
        
        doc = bson_new();
        bson_append_utf8(doc, "device_id", -1, id_str, -1);
        bson_append_utf8(doc, "device_type", -1, device_type, -1);
        bson_append_utf8(doc, "first_seen", -1, timestamp, -1);
        bson_append_utf8(doc, "last_seen", -1, timestamp, -1);
        bson_append_utf8(doc, "collector_hostname", -1, hostname, -1);
        bson_append_bool(doc, "status", -1, true);  // New device is active
        
        if (!mongoc_collection_insert_one(devices_collection, doc, NULL, NULL, &error)) {
            log_message(LOG_ERROR, "MongoDB insert error: %s", error.message);
        }
        bson_destroy(doc);
    } else {
        // Device exists, update the last_seen timestamp and status
        log_message(LOG_DEBUG, "Updating existing device %s in MongoDB", id_str);
        
        // Format timestamp
        char timestamp[30];
        strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", localtime(&now));
        
        bson_t *update = bson_new();
        BSON_APPEND_UTF8(update, "last_seen", timestamp);
        BSON_APPEND_BOOL(update, "status", true);  // Device is active
        
        doc = bson_new();
        BSON_APPEND_DOCUMENT(doc, "$set", update);
        
        bson_destroy(update);
        
        if (!mongoc_collection_update_one(devices_collection, query, doc, NULL, NULL, &error)) {
            log_message(LOG_ERROR, "MongoDB update error: %s", error.message);
        }
        bson_destroy(doc);
    }
    
    bson_destroy(query);
}

// Save sensor reading to MongoDB
bool save_sensor_data_to_mongodb(const char* id_type, uint8_t device_id, const char* sensor_type, float temp, float humid) {
    bson_t *doc;
    bson_error_t error;
    time_t now = time(NULL);
    char timestamp[30];
    char id_str[10];
    
    sprintf(id_str, "%02X", device_id);
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", localtime(&now));
    
    doc = bson_new();
    BSON_APPEND_UTF8(doc, "device_id", id_str);
    BSON_APPEND_UTF8(doc, "id_type", id_type);
    BSON_APPEND_UTF8(doc, "sensor_type", sensor_type);
    BSON_APPEND_UTF8(doc, "timestamp", timestamp);
    BSON_APPEND_DOUBLE(doc, "temperature", temp);
    BSON_APPEND_DOUBLE(doc, "humidity", humid);
    
    if (!mongoc_collection_insert_one(sensors_collection, doc, NULL, NULL, &error)) {
        log_message(LOG_ERROR, "MongoDB sensor data insert error: %s", error.message);
        bson_destroy(doc);
        return false;
    }
    
    log_message(LOG_DEBUG, "Saved sensor data to MongoDB: Device=0x%s, Temp=%.1f, Humid=%.1f",
               id_str, temp, humid);
    
    bson_destroy(doc);
    return true;
}

// Signal handler for graceful termination
void handle_signal(int sig) {
    log_message(LOG_INFO, "Signal %d received. Exiting...", sig);
    running = 0;
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
bool write_to_influxdb(float temperature, float humidity, const char *source) {
    CURLcode res;
    bool write_successful = false;
    static char data[256];  // Static to avoid stack allocations
    
    log_message(LOG_DEBUG, "Writing to InfluxDB - Source: %s, Temperature: %.2f, Humidity: %.2f", 
                source, temperature, humidity);
    
    // Create InfluxDB line protocol format with source tag
    // Format: measurement,tag_set field_set timestamp
    snprintf(data, sizeof(data), "environment,sensor=ESP32,source=%s temperature=%.2f,humidity=%.2f", 
             source, temperature, humidity);
    
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
            log_message(LOG_INFO, "Successfully wrote %s environmental data to InfluxDB", source);
        } else {
            log_message(LOG_ERROR, "Failed to write to InfluxDB: HTTP code %ld", response_code);
        }
    } else {
        log_message(LOG_ERROR, "Failed to write to InfluxDB: %s", curl_easy_strerror(res));
    }

    return write_successful;
}

// Write resistor measurements to InfluxDB with the specified format
bool write_resistor_data_to_influxdb(float v1, float v2, float v3, 
                                     float current, float p1, float p2, float p3, 
                                     const char *source) {
    CURLcode res;
    bool write_successful = false;
    static char data[512];  // Increased size for more fields
    float sum_voltage = v1 + v2 + v3;
    float sum_power = p1 + p2 + p3;
    
    // Calculate individual currents (they should all be the same in a series circuit,
    // but we'll calculate them here for completeness)
    float current_r1 = current;
    float current_r2 = current;
    float current_r3 = current;
    float sum_current = current_r1 + current_r2 + current_r3;
    
    log_message(LOG_DEBUG, "Writing resistor data to InfluxDB - Source: %s", source);
    
    // Create InfluxDB line protocol format with source tag and the requested structure
    // Format: measurement,tag_set field_set timestamp
    snprintf(data, sizeof(data), 
             "Analog_Measurement,sensor=ESP32,source=%s "
             "voltage_r1=%.3f,voltage_r2=%.3f,voltage_r3=%.3f,sum_voltage=%.3f,"
             "current_r1=%.3f,current_r2=%.3f,current_r3=%.3f,sum_current=%.3f,"
             "power_r1=%.3f,power_r2=%.3f,power_r3=%.3f,sum_power=%.3f", 
             source, 
             v1, v2, v3, sum_voltage,
             current_r1, current_r2, current_r3, sum_current,
             p1, p2, p3, sum_power);
    
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
            log_message(LOG_INFO, "Successfully wrote %s resistor data to InfluxDB", source);
        } else {
            log_message(LOG_ERROR, "Failed to write resistor data to InfluxDB: HTTP code %ld", response_code);
        }
    } else {
        log_message(LOG_ERROR, "Failed to write resistor data to InfluxDB: %s", curl_easy_strerror(res));
    }

    return write_successful;
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

// Function to send a generic Modbus command
int send_modbus_command(int fd, int gpio_pin, unsigned char *cmd, int cmd_length) {
    // Set to transmit mode
    gpioWrite(gpio_pin, RS485_TX_PIN_VALUE);
    delay_ms(20);
    
    // Print the message we're sending
    log_message(LOG_DEBUG, "Sending Modbus command:");
    if (current_log_level >= LOG_DEBUG) {
        print_hex_buffer(cmd, cmd_length);
    }
    
    // Flush input buffer
    tcflush(fd, TCIFLUSH);
    
    // Send the command
    int bytes_written = write(fd, cmd, cmd_length);
    if (bytes_written != cmd_length) {
        log_message(LOG_ERROR, "Error writing to serial port: %s", strerror(errno));
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
    
    modbus_queries++;
    return send_modbus_command(fd, gpio_pin, modbus_cmd, 8);
}

// Function to parse a Read Input Registers response for temperature and humidity
void parse_temperature_humidity_response(unsigned char *buffer, int length, float *temperature, float *humidity) {
    // Verify it's a proper response
    if (length < 3 || buffer[0] != SLAVE_ID || buffer[1] != FUNC_READ_INPUT) {
        log_message(LOG_WARNING, "Invalid response format");
        return;
    }
    
    // Get the byte count
    int byteCount = buffer[2];
    
    // Verify response length
    if (length < 3 + byteCount + 2) {
        log_message(LOG_WARNING, "Response too short");
        return;
    }
    
    // Extract register values
    uint16_t tempRaw, humidRaw;
    
    // We need at least 4 data bytes for temperature and humidity
    if (byteCount >= 4) {
        tempRaw = (buffer[3] << 8) | buffer[4];
        humidRaw = (buffer[5] << 8) | buffer[6];
        
        // Convert to actual values (divide by 10 since values are stored x10)
        *temperature = tempRaw / 10.0f;
        *humidity = humidRaw / 10.0f;
        
        log_message(LOG_INFO, "Parsed RTU values - Temperature: %.1f°C, Humidity: %.1f%%", 
                   *temperature, *humidity);
    } else {
        log_message(LOG_WARNING, "Not enough data in response");
    }
}

// Function to parse a Read Input Registers response for resistor measurements
void parse_resistor_data_response(unsigned char *buffer, int length) {
    // Verify it's a proper response
    if (length < 3 || buffer[0] != SLAVE_ID || buffer[1] != FUNC_READ_INPUT) {
        log_message(LOG_WARNING, "Invalid response format");
        return;
    }
    
    // Get the byte count
    int byteCount = buffer[2];
    
    // Verify response length (we need at least 7 registers = 14 bytes of data)
    if (byteCount < 14 || length < 3 + byteCount + 2) {
        log_message(LOG_WARNING, "Response too short for resistor data");
        return;
    }
    
    // Extract register values (×1000 scaling factor)
    uint16_t v1Raw = (buffer[3] << 8) | buffer[4];   // Register 2
    uint16_t v2Raw = (buffer[5] << 8) | buffer[6];   // Register 3
    uint16_t v3Raw = (buffer[7] << 8) | buffer[8];   // Register 4
    uint16_t currentRaw = (buffer[9] << 8) | buffer[10]; // Register 5
    uint16_t p1Raw = (buffer[11] << 8) | buffer[12]; // Register 6
    uint16_t p2Raw = (buffer[13] << 8) | buffer[14]; // Register 7
    uint16_t p3Raw = (buffer[15] << 8) | buffer[16]; // Register 8
    
    // Convert to actual values (divide by 1000 since values are stored x1000)
    last_rtu_voltage_r1 = v1Raw / 1000.0f;
    last_rtu_voltage_r2 = v2Raw / 1000.0f;
    last_rtu_voltage_r3 = v3Raw / 1000.0f;
    last_rtu_current = currentRaw / 1000.0f;
    last_rtu_power_r1 = p1Raw / 1000.0f;
    last_rtu_power_r2 = p2Raw / 1000.0f;
    last_rtu_power_r3 = p3Raw / 1000.0f;
    
    log_message(LOG_INFO, "Parsed RTU resistor values:");
    log_message(LOG_INFO, "  Voltages - R1: %.3fV, R2: %.3fV, R3: %.3fV", 
               last_rtu_voltage_r1, last_rtu_voltage_r2, last_rtu_voltage_r3);
    log_message(LOG_INFO, "  Current: %.3fmA", last_rtu_current * 1000.0);
    log_message(LOG_INFO, "  Power - R1: %.3fmW, R2: %.3fmW, R3: %.3fmW", 
               last_rtu_power_r1 * 1000.0, last_rtu_power_r2 * 1000.0, last_rtu_power_r3 * 1000.0);
}

// Read temperature and humidity via Modbus
bool read_temperature_humidity_rtu(int serial_fd, int gpio_pin, float *temperature, float *humidity) {
    unsigned char buffer[MAX_BUFFER_SIZE];
    int bytes_read;
    
    // Send request to read two input registers starting at address 0
    if (send_read_input_registers(serial_fd, gpio_pin, REG_TEMPERATURE, 2) != 0) {
        log_message(LOG_ERROR, "Failed to send Modbus request for temperature/humidity");
        return false;
    }
    
    // Wait for response (300ms should be more than enough)
    delay_ms(300);
    
    // Read the response
    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
    
    if (bytes_read <= 0) {
        log_message(LOG_ERROR, "No response received from Modbus slave for temperature/humidity");
        return false;
    }
    
    // Debug output
    log_message(LOG_DEBUG, "Received temperature/humidity response (%d bytes):", bytes_read);
    if (current_log_level >= LOG_DEBUG) {
        print_hex_buffer(buffer, bytes_read);
    }
    
    // Parse the response
    parse_temperature_humidity_response(buffer, bytes_read, temperature, humidity);
    
    // Check for valid range
    if (*temperature < -40.0 || *temperature > 85.0 || 
        *humidity < 0.0 || *humidity > 100.0) {
        log_message(LOG_WARNING, "RTU values out of valid range");
        return false;
    }
    
    modbus_replies++;
    return true;
}

// Read resistor data via Modbus
bool read_resistor_data_rtu(int serial_fd, int gpio_pin) {
    unsigned char buffer[MAX_BUFFER_SIZE];
    int bytes_read;
    
    // Send request to read 7 input registers starting at address 2 (registers 2-8)
    if (send_read_input_registers(serial_fd, gpio_pin, REG_VOLTAGE_R1, 7) != 0) {
        log_message(LOG_ERROR, "Failed to send Modbus request for resistor data");
        return false;
    }
    
    // Wait for response (300ms should be more than enough)
    delay_ms(300);
    
    // Read the response
    bytes_read = read_serial(serial_fd, buffer, MAX_BUFFER_SIZE, 2000);
    
    if (bytes_read <= 0) {
        log_message(LOG_ERROR, "No response received from Modbus slave for resistor data");
        return false;
    }
    
    // Debug output
    log_message(LOG_DEBUG, "Received resistor data response (%d bytes):", bytes_read);
    if (current_log_level >= LOG_DEBUG) {
        print_hex_buffer(buffer, bytes_read);
    }
    
    // Parse the response
    parse_resistor_data_response(buffer, bytes_read);
    
    modbus_replies++;
    return true;
}

// Extract temperature and humidity data from CAN frame
bool extract_can_data(const struct can_frame *frame, float *temperature, float *humidity) {
    if (frame->can_dlc != 8) {
        log_message(LOG_WARNING, "Expected 8 bytes of CAN data but received %d bytes", frame->can_dlc);
        return false;
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
    
    // Convert binary representations to float values
    memcpy(temperature, &tempBits, 4);
    memcpy(humidity, &humidBits, 4);
    
    log_message(LOG_INFO, "Parsed CAN values - Temperature: %.1f°C, Humidity: %.1f%%", 
               *temperature, *humidity);
    
    // Check for valid range
    if (*temperature < -40.0 || *temperature > 85.0 || 
        *humidity < 0.0 || *humidity > 100.0) {
        log_message(LOG_WARNING, "CAN values out of valid range");
        return false;
    }
    
    return true;
}

// Extract voltage data from CAN frame
bool extract_can_voltage_data(const struct can_frame *frame) {
    if (frame->can_dlc != 8) {
        log_message(LOG_WARNING, "Expected 8 bytes of CAN voltage data but received %d bytes", frame->can_dlc);
        return false;
    }
    
    // Extract voltages using the same format as in the ESP32 code
    // First voltage (3 bytes)
    uint32_t v1Bits = 
        ((uint32_t)frame->data[0] << 16) | 
        ((uint32_t)frame->data[1] << 8) | 
        (uint32_t)frame->data[2];
    
    // Second voltage (3 bytes)
    uint32_t v2Bits = 
        ((uint32_t)frame->data[3] << 16) | 
        ((uint32_t)frame->data[4] << 8) | 
        (uint32_t)frame->data[5];
    
    // Third voltage (2 bytes scaled by 1000)
    uint16_t v3Short = 
        ((uint16_t)frame->data[6] << 8) | 
        (uint16_t)frame->data[7];
    
    // Convert to actual values
    // Note: This requires adjustment based on how the ESP32 encoded the values
    // For the 24-bit values, we'll convert them back to the original range
    last_voltage_r1 = v1Bits / 65536.0;
    last_voltage_r2 = v2Bits / 65536.0;
    last_voltage_r3 = v3Short / 1000.0;
    
    log_message(LOG_INFO, "Parsed CAN voltage values - R1: %.3fV, R2: %.3fV, R3: %.3fV", 
               last_voltage_r1, last_voltage_r2, last_voltage_r3);
    
    time(&last_voltage_read);
    return true;
}

// Extract current data from CAN frame
bool extract_can_current_data(const struct can_frame *frame) {
    if (frame->can_dlc < 4) {
        log_message(LOG_WARNING, "Expected at least 4 bytes of CAN current data but received %d bytes", frame->can_dlc);
        return false;
    }
    
    // Extract current using the same format as in the ESP32 code
    uint32_t currentBits = 
        ((uint32_t)frame->data[0] << 24) | 
        ((uint32_t)frame->data[1] << 16) | 
        ((uint32_t)frame->data[2] << 8) | 
        (uint32_t)frame->data[3];
    
    // Convert binary representation to float value
    memcpy(&last_current, &currentBits, 4);
    
    log_message(LOG_INFO, "Parsed CAN current value: %.3f mA", last_current * 1000.0);
    
    time(&last_current_read);
    return true;
}

// Extract power data from CAN frame
bool extract_can_power_data(const struct can_frame *frame) {
    if (frame->can_dlc != 8) {
        log_message(LOG_WARNING, "Expected 8 bytes of CAN power data but received %d bytes", frame->can_dlc);
        return false;
    }
    
    // Extract power values using the same format as in the ESP32 code
    // All values are 16-bit integers scaled by 1000
    uint16_t p1Short = ((uint16_t)frame->data[0] << 8) | (uint16_t)frame->data[1];
    uint16_t p2Short = ((uint16_t)frame->data[2] << 8) | (uint16_t)frame->data[3];
    uint16_t p3Short = ((uint16_t)frame->data[4] << 8) | (uint16_t)frame->data[5];
    uint16_t totalPowerShort = ((uint16_t)frame->data[6] << 8) | (uint16_t)frame->data[7];
    
    // Convert to actual values
    last_power_r1 = p1Short / 1000.0;
    last_power_r2 = p2Short / 1000.0;
    last_power_r3 = p3Short / 1000.0;
    float totalPower = totalPowerShort / 1000.0;
    
    log_message(LOG_INFO, "Parsed CAN power values - R1: %.3f mW, R2: %.3f mW, R3: %.3f mW, Total: %.3f mW", 
               last_power_r1 * 1000.0, last_power_r2 * 1000.0, last_power_r3 * 1000.0, totalPower * 1000.0);
    
    time(&last_power_read);
    return true;
}

// Try to read temperature and humidity from CAN bus
bool read_temperature_humidity_can(int can_socket, float *temperature, float *humidity) {
    struct can_frame frame;
    fd_set read_fds;
    struct timeval timeout;
    
    // Set up for select() with timeout
    FD_ZERO(&read_fds);
    FD_SET(can_socket, &read_fds);
    
    // Set timeout to 500ms
    timeout.tv_sec = 0;
    timeout.tv_usec = 500000;
    
    // Wait for socket to become readable or timeout
    int select_result = select(can_socket + 1, &read_fds, NULL, NULL, &timeout);
    
    if (select_result > 0 && FD_ISSET(can_socket, &read_fds)) {
        // Socket is readable, receive message
        int nbytes = read(can_socket, &frame, sizeof(struct can_frame));
        
        if (nbytes > 0) {
            can_messages++;
            
            // Process based on the CAN ID
            switch (frame.can_id) {
                case TARGET_CAN_ID:
                    log_message(LOG_DEBUG, "Received CAN frame with ID 0x%X (Environment data)", frame.can_id);
                    return extract_can_data(&frame, temperature, humidity);
                
                case VOLTAGE_CAN_ID:
                    log_message(LOG_DEBUG, "Received CAN frame with ID 0x%X (Voltage data)", frame.can_id);
                    return extract_can_voltage_data(&frame);
                
                case CURRENT_CAN_ID:
                    log_message(LOG_DEBUG, "Received CAN frame with ID 0x%X (Current data)", frame.can_id);
                    return extract_can_current_data(&frame);
                
                case POWER_CAN_ID:
                    log_message(LOG_DEBUG, "Received CAN frame with ID 0x%X (Power data)", frame.can_id);
                    return extract_can_power_data(&frame);
                
                default:
                    log_message(LOG_DEBUG, "Received CAN frame with unexpected ID 0x%X", frame.can_id);
                    return false;
            }
        } else if (nbytes < 0) {
            log_message(LOG_ERROR, "CAN message reception failed: %s", strerror(errno));
            error_count++;
        }
    } else if (select_result < 0) {
        // Error in select
        log_message(LOG_ERROR, "CAN select failed: %s", strerror(errno));
        error_count++;
    }
    
    // No data received in time
    return false;
}

// Process CAN messages to get all types of data
void process_all_can_messages(int can_socket) {
    struct can_frame frame;
    fd_set read_fds;
    struct timeval timeout;
    float temp, humid;
    int messages_processed = 0;
    
    // Process up to 10 messages per call to avoid blocking too long
    for (int i = 0; i < 10; i++) {
        // Set up for select() with timeout
        FD_ZERO(&read_fds);
        FD_SET(can_socket, &read_fds);
        
        // Set timeout to 100ms
        timeout.tv_sec = 0;
        timeout.tv_usec = 100000;
        
        // Wait for socket to become readable or timeout
        int select_result = select(can_socket + 1, &read_fds, NULL, NULL, &timeout);
        
        if (select_result > 0 && FD_ISSET(can_socket, &read_fds)) {
            // Socket is readable, receive message
            int nbytes = read(can_socket, &frame, sizeof(struct can_frame));
            
            if (nbytes > 0) {
                can_messages++;
                messages_processed++;
                
                // Process based on the CAN ID
                // First check if it's an extended CAN ID
                if (IS_EXTENDED_ID(frame.can_id)) {
                    uint8_t msg_type = GET_EXT_MSG_TYPE(frame.can_id);
                    uint8_t source = GET_EXT_SOURCE(frame.can_id);
                    uint8_t priority = GET_EXT_PRIORITY(frame.can_id);
                    
                    log_message(LOG_DEBUG, "Received extended CAN frame: ID=0x%X, Priority=%d, Source=0x%X, Type=0x%X", 
                               frame.can_id, priority, source, msg_type);
                    
                    // Only update device activity for non-architecture messages
                    // Architecture messages will be handled specifically in the switch case
                    
                    switch (msg_type) {
                        case MSG_ARCHITECTURE_ID:
                            // Process architecture information message
                            {
                                char arch_name[9] = {0}; // 8 chars + null terminator
                                int name_len = frame.can_dlc > 8 ? 8 : frame.can_dlc;
                                
                                // Extract architecture name from payload
                                for (int i = 0; i < name_len; i++) {
                                    arch_name[i] = (char)frame.data[i];
                                }
                                
                                log_message(LOG_INFO, "Received architecture info from device 0x%02X: %s", 
                                           source, arch_name);
                                
                                // Save device info with actual architecture name
                                char device_type[64];
                                snprintf(device_type, sizeof(device_type), "ESP32_%s", arch_name);
                                save_device_info_to_mongodb(source, device_type);
                            }
                            break;
                            
                        case MSG_ENV_HUMIDITY:
                        case MSG_TEMP_AMBIENT:
                            if (extract_can_data(&frame, &temp, &humid)) {
                                last_can_temperature = temp;
                                last_can_humidity = humid;
                                time(&last_can_read);
                                
                                // Write to InfluxDB with source tag "CAN"
                                if (write_to_influxdb(temp, humid, "CAN")) {
                                    influx_writes++;
                                } else {
                                    error_count++;
                                }
                                
                                // Save to MongoDB
                                save_sensor_data_to_mongodb("extended", source, "Environment", temp, humid);
                            }
                            break;
                        case MSG_ELECTRICAL_DC_VOLTAGE:
                            log_message(LOG_DEBUG, "Received extended CAN frame with voltage data");
                            extract_can_voltage_data(&frame);
                            break;
                        case MSG_ELECTRICAL_DC_CURRENT:
                            log_message(LOG_DEBUG, "Received extended CAN frame with current data");
                            extract_can_current_data(&frame);
                            break;
                        case MSG_ELECTRICAL_ACTIVE_POWER:
                            log_message(LOG_DEBUG, "Received extended CAN frame with power data");
                            extract_can_power_data(&frame);
                            
                            // If we have both voltage and current readings, write to InfluxDB
                            if (last_voltage_read > 0 && last_current_read > 0) {
                                if (write_resistor_data_to_influxdb(last_voltage_r1, last_voltage_r2, last_voltage_r3, 
                                                                last_current, last_power_r1, last_power_r2, last_power_r3, 
                                                                "CAN")) {
                                    influx_writes++;
                                } else {
                                    error_count++;
                                }
                            }
                            break;
                        default:
                            log_message(LOG_DEBUG, "Received extended CAN frame with unhandled message type: 0x%X", msg_type);
                            break;
                    }
                } else {
                    // For backward compatibility, also handle legacy CAN IDs
                    switch (frame.can_id) {
                        case TARGET_CAN_ID_LEGACY:
                            log_message(LOG_DEBUG, "Received legacy CAN frame with ID 0x%X (Environment data)", frame.can_id);
                            // Track legacy device activity
                            save_device_info_to_mongodb(0xFF, "CAN_Legacy_Device");
                            
                            if (extract_can_data(&frame, &temp, &humid)) {
                                last_can_temperature = temp;
                                last_can_humidity = humid;
                                time(&last_can_read);
                                
                                // Write to InfluxDB with source tag "CAN"
                                if (write_to_influxdb(temp, humid, "CAN")) {
                                    influx_writes++;
                                } else {
                                    error_count++;
                                }
                                
                                // Save to MongoDB
                                save_sensor_data_to_mongodb("legacy", 0x00, "Environment", temp, humid);
                            }
                            break;
                        case VOLTAGE_CAN_ID_LEGACY:
                            log_message(LOG_DEBUG, "Received legacy CAN frame with ID 0x%X (Voltage data)", frame.can_id);
                            // Track legacy device activity
                            save_device_info_to_mongodb(0xFF, "CAN_Legacy_Device");
                            extract_can_voltage_data(&frame);
                            break;
                        case CURRENT_CAN_ID_LEGACY:
                            log_message(LOG_DEBUG, "Received legacy CAN frame with ID 0x%X (Current data)", frame.can_id);
                            // Track legacy device activity
                            save_device_info_to_mongodb(0xFF, "CAN_Legacy_Device");
                            extract_can_current_data(&frame);
                            break;
                        case POWER_CAN_ID_LEGACY:
                            log_message(LOG_DEBUG, "Received legacy CAN frame with ID 0x%X (Power data)", frame.can_id);
                            // Track legacy device activity
                            save_device_info_to_mongodb(0xFF, "CAN_Legacy_Device");
                            extract_can_power_data(&frame);
                            
                            // If we have both voltage and current readings, write to InfluxDB
                            if (last_voltage_read > 0 && last_current_read > 0) {
                                if (write_resistor_data_to_influxdb(last_voltage_r1, last_voltage_r2, last_voltage_r3, 
                                                                last_current, last_power_r1, last_power_r2, last_power_r3, 
                                                                "CAN")) {
                                    influx_writes++;
                                } else {
                                    error_count++;
                                }
                            }
                            break;
                        default:
                            log_message(LOG_DEBUG, "Received CAN frame with unexpected ID 0x%X", frame.can_id);
                            break;
                    }
                }
            } else if (nbytes < 0) {
                log_message(LOG_ERROR, "CAN message reception failed: %s", strerror(errno));
                error_count++;
            }
        } else {
            // No more messages available
            break;
        }
    }
    
    if (messages_processed > 0) {
        log_message(LOG_DEBUG, "Processed %d CAN messages", messages_processed);
    }
}

// Print statistics
void print_statistics() {
    log_message(LOG_INFO, "--- Statistics Update ---");
    log_message(LOG_INFO, "Modbus RTU Queries Sent: %lu", modbus_queries);
    log_message(LOG_INFO, "Modbus RTU Replies Received: %lu", modbus_replies);
    log_message(LOG_INFO, "CAN Messages Received: %lu", can_messages);
    log_message(LOG_INFO, "InfluxDB Writes: %lu", influx_writes);
    log_message(LOG_INFO, "Errors: %lu", error_count);
    
    // Print device status
    print_device_statistics();
    
    float modbus_success = (modbus_replies > 0 && modbus_queries > 0) ? 
                           ((float)modbus_replies / modbus_queries * 100) : 0;
    
    log_message(LOG_INFO, "Modbus RTU Success Rate: %.1f%%", modbus_success);
    
    // Environment data
    log_message(LOG_INFO, "==== Environment Data ====");
    log_message(LOG_INFO, "RTU Temperature: %.2f°C, Humidity: %.2f%%", 
               last_rtu_temperature, last_rtu_humidity);
    log_message(LOG_INFO, "CAN Temperature: %.2f°C, Humidity: %.2f%%", 
               last_can_temperature, last_can_humidity);
    
    // Resistor data
    log_message(LOG_INFO, "==== Resistor Measurements ====");
    log_message(LOG_INFO, "Voltages (RTU) - R1: %.3fV, R2: %.3fV, R3: %.3fV", 
               last_rtu_voltage_r1, last_rtu_voltage_r2, last_rtu_voltage_r3);
    log_message(LOG_INFO, "Current (RTU): %.3fmA", last_rtu_current * 1000.0);
    log_message(LOG_INFO, "Power (RTU) - R1: %.3fmW, R2: %.3fmW, R3: %.3fmW", 
               last_rtu_power_r1 * 1000.0, last_rtu_power_r2 * 1000.0, last_rtu_power_r3 * 1000.0);
    
    log_message(LOG_INFO, "Voltages (CAN) - R1: %.3fV, R2: %.3fV, R3: %.3fV", 
               last_voltage_r1, last_voltage_r2, last_voltage_r3);
    log_message(LOG_INFO, "Current (CAN): %.3f mA", last_current * 1000.0);
    log_message(LOG_INFO, "Power (CAN) - R1: %.3f mW, R2: %.3f mW, R3: %.3f mW", 
               last_power_r1 * 1000.0, last_power_r2 * 1000.0, last_power_r3 * 1000.0);
    
    // Get formatted timestamps of last successful reads
    char rtu_time_buffer[30];
    char can_time_buffer[30];
    char voltage_time_buffer[30];
    char current_time_buffer[30];
    char power_time_buffer[30];
    struct tm *tm_info;
    
    if (last_rtu_read > 0) {
        tm_info = localtime(&last_rtu_read);
        strftime(rtu_time_buffer, 30, "%Y-%m-%d %H:%M:%S", tm_info);
        log_message(LOG_INFO, "Last Successful RTU Environment Read: %s", rtu_time_buffer);
    }
    
    if (last_can_read > 0) {
        tm_info = localtime(&last_can_read);
        strftime(can_time_buffer, 30, "%Y-%m-%d %H:%M:%S", tm_info);
        log_message(LOG_INFO, "Last Successful CAN Environment Read: %s", can_time_buffer);
    }
    
    if (last_voltage_read > 0) {
        tm_info = localtime(&last_voltage_read);
        strftime(voltage_time_buffer, 30, "%Y-%m-%d %H:%M:%S", tm_info);
        log_message(LOG_INFO, "Last Successful Voltage Read: %s", voltage_time_buffer);
    }
    
    if (last_current_read > 0) {
        tm_info = localtime(&last_current_read);
        strftime(current_time_buffer, 30, "%Y-%m-%d %H:%M:%S", tm_info);
        log_message(LOG_INFO, "Last Successful Current Read: %s", current_time_buffer);
    }
    
    if (last_power_read > 0) {
        tm_info = localtime(&last_power_read);
        strftime(power_time_buffer, 30, "%Y-%m-%d %H:%M:%S", tm_info);
        log_message(LOG_INFO, "Last Successful Power Read: %s", power_time_buffer);
    }
}

int main(void) {
    int serial_fd;
    int can_socket;
    struct sockaddr_can addr;
    struct ifreq ifr;
    struct termios tty;
    time_t last_stats_time = 0;
    time_t last_rtu_resistor_time = 0;
    time_t current_time;
    float rtu_temperature, rtu_humidity;
    
    // Set up signal handling for graceful termination
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);
    
    log_message(LOG_INFO, "Starting Combined ESP32 Modbus RTU and CAN Monitor with Resistor Measurements...");
    log_message(LOG_INFO, "Press Ctrl+C to exit");

    // Initialize PIGPIO library for RS485 direction control
    if (gpioInitialise() < 0) {
        log_message(LOG_ERROR, "Failed to initialize pigpio");
        return EXIT_FAILURE;
    }
    
    // Set the control pin as output
    gpioSetMode(SERIAL_COMMUNICATION_CONTROL_PIN, PI_OUTPUT);
    gpioWrite(SERIAL_COMMUNICATION_CONTROL_PIN, RS485_RX_PIN_VALUE); // Start in receive mode
    
    // Initialize CURL globally
    curl_global_init(CURL_GLOBAL_DEFAULT);
    
    // Initialize CURL resources
    if (!init_curl_resources()) {
        log_message(LOG_ERROR, "Failed to initialize CURL resources");
        curl_global_cleanup();
        gpioTerminate();
        return EXIT_FAILURE;
    }
    
    // Initialize MongoDB
    mongoc_init();
    mongo_client = mongoc_client_new("mongodb://localhost:27017");
    
    if (!mongo_client) {
        log_message(LOG_ERROR, "Failed to create MongoDB client");
        cleanup_resources();
        return EXIT_FAILURE;
    }
    
    database = mongoc_client_get_database(mongo_client, "canbus_data");
    devices_collection = mongoc_database_get_collection(database, "devices");
    sensors_collection = mongoc_database_get_collection(database, "sensor_readings");
    
    log_message(LOG_INFO, "MongoDB initialized successfully");
    
    // Test InfluxDB connection
    if (!test_influxdb_connection()) {
        log_message(LOG_WARNING, "Failed to connect to InfluxDB. Will continue but data won't be stored.");
    }

    // Open and configure serial port for Modbus RTU
    log_message(LOG_INFO, "Opening serial port %s...", SERIAL_PORT);
    serial_fd = open(SERIAL_PORT, O_RDWR | O_NOCTTY | O_NDELAY);
    if (serial_fd < 0) {
        log_message(LOG_ERROR, "Error opening %s: %s", SERIAL_PORT, strerror(errno));
        cleanup_resources();
        return EXIT_FAILURE;
    }
    
    // Get current serial port attributes
    memset(&tty, 0, sizeof(tty));
    if (tcgetattr(serial_fd, &tty) != 0) {
        log_message(LOG_ERROR, "Error from tcgetattr: %s", strerror(errno));
        close(serial_fd);
        cleanup_resources();
        return EXIT_FAILURE;
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
        log_message(LOG_ERROR, "Error from tcsetattr: %s", strerror(errno));
        close(serial_fd);
        cleanup_resources();
        return EXIT_FAILURE;
    }
    
    // Clear any existing data in the buffer
    tcflush(serial_fd, TCIOFLUSH);
    
    log_message(LOG_INFO, "Serial port configured successfully at 9600 baud");
    
    // Open and configure CAN socket
    log_message(LOG_INFO, "Opening CAN interface %s...", CAN_INTERFACE);
    
    // Create CAN socket
    can_socket = socket(PF_CAN, SOCK_RAW, CAN_RAW);
    if (can_socket < 0) {
        log_message(LOG_ERROR, "Error creating CAN socket: %s", strerror(errno));
        close(serial_fd);
        cleanup_resources();
        return EXIT_FAILURE;
    }
    
    // Get CAN interface index
    strcpy(ifr.ifr_name, CAN_INTERFACE);
    if (ioctl(can_socket, SIOCGIFINDEX, &ifr) < 0) {
        log_message(LOG_ERROR, "Error getting CAN interface index: %s", strerror(errno));
        close(can_socket);
        close(serial_fd);
        cleanup_resources();
        return EXIT_FAILURE;
    }
    
    // Bind CAN socket to interface
    addr.can_family = AF_CAN;
    addr.can_ifindex = ifr.ifr_ifindex;
    if (bind(can_socket, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        log_message(LOG_ERROR, "Error binding CAN socket: %s", strerror(errno));
        close(can_socket);
        close(serial_fd);
        cleanup_resources();
        return EXIT_FAILURE;
    }
    
    // We'll process all CAN IDs and filter in software
    log_message(LOG_INFO, "CAN interface configured successfully");
    log_message(LOG_INFO, "Monitoring for CAN IDs: 0x%X (Environment), 0x%X (Voltage), 0x%X (Current), 0x%X (Power)",
                TARGET_CAN_ID, VOLTAGE_CAN_ID, CURRENT_CAN_ID, POWER_CAN_ID);
    log_message(LOG_INFO, "Starting monitoring loop...");
    
    // Main loop
    while (running) {
        // Read temperature and humidity via Modbus RTU
        if (read_temperature_humidity_rtu(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN, &rtu_temperature, &rtu_humidity)) {
            // Update last successful values
            last_rtu_temperature = rtu_temperature;
            last_rtu_humidity = rtu_humidity;
            time(&last_rtu_read);
            
            // Write to InfluxDB with source tag "RTU"
            if (write_to_influxdb(rtu_temperature, rtu_humidity, "RTU")) {
                influx_writes++;
            } else {
                error_count++;
            }
        }
        
        // Read resistor data via Modbus RTU every 5 seconds
        time(&current_time);
        if (current_time - last_rtu_resistor_time >= 5) {
            if (read_resistor_data_rtu(serial_fd, SERIAL_COMMUNICATION_CONTROL_PIN)) {
                // Write resistor data to InfluxDB
                if (write_resistor_data_to_influxdb(
                        last_rtu_voltage_r1, last_rtu_voltage_r2, last_rtu_voltage_r3,
                        last_rtu_current, last_rtu_power_r1, last_rtu_power_r2, last_rtu_power_r3,
                        "RTU")) {
                    influx_writes++;
                } else {
                    error_count++;
                }
                last_rtu_resistor_time = current_time;
            }
        }
        
        // Process CAN messages (both environment and resistor data)
        process_all_can_messages(can_socket);
        
        // Print statistics once per minute
        if (current_time - last_stats_time >= 60) {
            print_statistics();
            last_stats_time = current_time;
        }
        
        // Check device status every DEVICE_TIMEOUT_SECONDS / 2 seconds
        if (current_time - last_device_status_check >= DEVICE_TIMEOUT_SECONDS / 2) {
            check_device_status();
        }
        
        // Short delay between iterations
        usleep(100000);  // 100ms delay
    }
    
    // Clean up
    log_message(LOG_INFO, "Shutting down...");
    close(serial_fd);
    close(can_socket);
    cleanup_resources();
    
    // Final statistics
    print_statistics();
    log_message(LOG_INFO, "Monitor terminated successfully");
    
    return EXIT_SUCCESS;
}

void cleanup_resources() {
    // Clean up CURL resources
    cleanup_curl_resources();
    curl_global_cleanup();
    
    // Clean up MongoDB resources
    if (devices_collection) mongoc_collection_destroy(devices_collection);
    if (sensors_collection) mongoc_collection_destroy(sensors_collection);
    if (database) mongoc_database_destroy(database);
    if (mongo_client) mongoc_client_destroy(mongo_client);
    mongoc_cleanup();
    
    // Serial port is closed in main
    
    // Terminate GPIO library
    gpioTerminate();
    
    log_message(LOG_INFO, "Resources cleaned up");
}
