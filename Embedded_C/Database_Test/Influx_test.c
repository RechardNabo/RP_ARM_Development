#include <stdio.h>
#include <curl/curl.h>
#include <string.h>
#include <unistd.h>
#include <stdbool.h>
#include <stdlib.h>
#include <time.h>

#define INFLUXDB_URL "http://localhost:8086/ping"  // InfluxDB ping endpoint
#define INFLUXDB_WRITE_URL "http://localhost:8086/api/v2/write?org=13d05bde442bdf3e&bucket=_monitoring&precision=ns"
#define INFLUXDB_TOKEN "n42FdVEFModulJNOGZDYP1wqbbr0VQeeVlSC85hAWh4_olF_5K217koKdfxiAnNe9gzLGxuX6sCQamxVAiNuEA=="

// Structure to capture response data
struct WriteResponse {
    char *memory;
    size_t size;
};

// Callback function to handle response and capture error messages
size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct WriteResponse *mem = (struct WriteResponse *)userp;

    char *ptr = realloc(mem->memory, mem->size + realsize + 1);
    if (!ptr) {
        printf("[ERROR] Not enough memory (realloc returned NULL)\n");
        return 0;
    }

    mem->memory = ptr;
    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->memory[mem->size] = 0;

    return realsize;
}

bool write_to_influxdb(double value) {
    CURL *curl;
    CURLcode res;
    bool write_successful = false;
    struct curl_slist *headers = NULL;
    char data[512];
    struct WriteResponse response = {0};
    
    // Initialize response buffer
    response.memory = malloc(1);
    response.size = 0;

    // Get current timestamp in nanoseconds
    struct timespec ts;
    clock_gettime(CLOCK_REALTIME, &ts);
    long long timestamp_ns = (long long)ts.tv_sec * 1000000000LL + ts.tv_nsec;

    // Format the data point with timestamp
    snprintf(data, sizeof(data), "random_numbers value=%f %lld", value, timestamp_ns);

    printf("[DEBUG] Writing data: %s\n", data);

    curl = curl_easy_init();
    if (curl) {
        // Set headers
        char auth_header[256];
        snprintf(auth_header, sizeof(auth_header), "Authorization: Token %s", INFLUXDB_TOKEN);
        headers = curl_slist_append(headers, auth_header);
        headers = curl_slist_append(headers, "Content-Type: text/plain; charset=utf-8");
        headers = curl_slist_append(headers, "Accept: application/json");
        
        // Set URL and headers
        curl_easy_setopt(curl, CURLOPT_URL, INFLUXDB_WRITE_URL);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POST, 1L);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&response);
        
        // Enable verbose output for debugging
        curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);

        // Perform request
        res = curl_easy_perform(curl);

        if (res == CURLE_OK) {
            long response_code;
            curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &response_code);
            printf("[DEBUG] HTTP Response code: %ld\n", response_code);
            
            if (response.memory && response.size > 0) {
                printf("[DEBUG] Response body: %s\n", response.memory);
            }
            
            if (response_code == 204) {
                write_successful = true;
                printf("[SUCCESS] Written value: %f\n", value);
            } else {
                printf("[ERROR] Write failed with HTTP code: %ld\n", response_code);
                if (response.memory) {
                    printf("[ERROR] Error message: %s\n", response.memory);
                }
            }
        } else {
            printf("[ERROR] CURL failed: %s\n", curl_easy_strerror(res));
        }

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    
    if (response.memory) {
        free(response.memory);
    }

    return write_successful;
}

bool test_influxdb_connection() {
    CURL *curl;
    CURLcode res;
    bool connection_successful = false;
    long response_code;
    struct WriteResponse response = {0};
    
    // Initialize response buffer
    response.memory = malloc(1);
    response.size = 0;

    printf("[INFO] Testing InfluxDB connection...\n");
    curl = curl_easy_init();
    if (curl) {
        // Set URL
        curl_easy_setopt(curl, CURLOPT_URL, INFLUXDB_URL);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&response);

        // Perform request
        res = curl_easy_perform(curl);

        if (res != CURLE_OK) {
            fprintf(stderr, "[ERROR] Connection failed: %s\n", curl_easy_strerror(res));
        } else {
            curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &response_code);
            printf("[DEBUG] Ping response code: %ld\n", response_code);

            if (response_code == 204) {
                printf("[SUCCESS] InfluxDB is running and accessible!\n");
                connection_successful = true;
            } else {
                printf("[ERROR] Unexpected ping response: %ld\n", response_code);
            }
        }

        curl_easy_cleanup(curl);
    }
    
    if (response.memory) {
        free(response.memory);
    }

    return connection_successful;
}

// Function to test token and bucket permissions
bool test_write_permissions() {
    printf("[INFO] Testing write permissions...\n");
    
    // Try to write a test point
    double test_value = 42.0;
    return write_to_influxdb(test_value);
}

int main() {
    printf("\n[START] InfluxDB Connection and Write Test\n");
    printf("[INFO] Using token: %.20s...\n", INFLUXDB_TOKEN);
    printf("[INFO] Target bucket: _monitoring\n");

    // Initialize CURL and random seed
    curl_global_init(CURL_GLOBAL_ALL);
    srand(time(NULL));

    // Test connection first
    if (!test_influxdb_connection()) {
        printf("[ERROR] Cannot connect to InfluxDB. Check if it's running.\n");
        curl_global_cleanup();
        return 1;
    }

    // Test write permissions
    printf("[INFO] Testing write permissions with a sample data point...\n");
    if (!test_write_permissions()) {
        printf("[ERROR] Write test failed. Check token permissions and bucket access.\n");
        curl_global_cleanup();
        return 1;
    }

    printf("[INFO] All tests passed! Starting to write random numbers...\n");
    
    // Write random numbers (reduced to 10 for testing)
    for (int i = 0; i < 10; i++) {
        double random_value = (double)rand() / RAND_MAX * 100.0;
        printf("[INFO] Attempt %d: Writing value %f\n", i + 1, random_value);
        
        if (!write_to_influxdb(random_value)) {
            printf("[ERROR] Failed to write value %f\n", random_value);
        }
        
        sleep(1);  // Sleep for 1 second between writes
    }

    printf("[INFO] Completed writing random numbers\n");
    
    // Cleanup
    curl_global_cleanup();
    printf("[END] Program completed\n\n");

    return 0;
}