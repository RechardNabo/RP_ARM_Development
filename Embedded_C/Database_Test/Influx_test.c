#include <stdio.h>
#include <curl/curl.h>
#include <string.h>
#include <unistd.h>
#include <stdbool.h>
#include <stdlib.h>
#include <time.h>

#define INFLUXDB_URL "http://localhost:8086/ping"  // InfluxDB ping endpoint
#define INFLUXDB_WRITE_URL "http://localhost:8086/api/v2/write?org=13d05bde442bdf3e&bucket=_monitoring&precision=ns"
#define INFLUXDB_TOKEN "KNGXplVdrjHBxMRB-iEz2hIIvZ2hFhZ0voviIaOhLDqCLam5YBKzYTp-dxwDSuKIn5RNaPnUZ6yIYdgEzj4tYA=="

// Callback function to handle response
size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    printf("[DEBUG] Received response callback\n");
    return size * nmemb;  // Return size of received data
}

bool write_to_influxdb(double value) {
    CURL *curl;
    CURLcode res;
    bool write_successful = false;
    struct curl_slist *headers = NULL;
    char data[256];

    // Format the data point
    snprintf(data, sizeof(data), "random_numbers value=%f", value);

    curl = curl_easy_init();
    if (curl) {
        // Set headers
        char auth_header[256];
        snprintf(auth_header, sizeof(auth_header), "Authorization: Token %s", INFLUXDB_TOKEN);
        headers = curl_slist_append(headers, auth_header);
        headers = curl_slist_append(headers, "Content-Type: text/plain; charset=utf-8");
        
        // Set URL and headers
        curl_easy_setopt(curl, CURLOPT_URL, INFLUXDB_WRITE_URL);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POST, 1L);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);

        // Perform request
        res = curl_easy_perform(curl);

        if (res == CURLE_OK) {
            long response_code;
            curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &response_code);
            if (response_code == 204) {
                write_successful = true;
                printf("[SUCCESS] Written value: %f\n", value);
            }
        }

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }

    return write_successful;
}

bool test_influxdb_connection() {
    CURL *curl;
    CURLcode res;
    bool connection_successful = false;
    long response_code;

    printf("[INFO] Initializing CURL for connection test...\n");
    curl = curl_easy_init();
    if (curl) {
        printf("[INFO] Setting up CURL options...\n");
        // Set URL
        curl_easy_setopt(curl, CURLOPT_URL, INFLUXDB_URL);
        printf("[DEBUG] URL set to: %s\n", INFLUXDB_URL);

        // Set callback function
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        printf("[DEBUG] Write callback function set\n");

        printf("[INFO] Attempting to connect to InfluxDB...\n");
        // Perform request
        res = curl_easy_perform(curl);

        // Check for errors
        if (res != CURLE_OK) {
            fprintf(stderr, "[ERROR] Connection failed: %s\n", curl_easy_strerror(res));
            printf("[DEBUG] CURL error code: %d\n", res);
        } else {
            // Get HTTP response code
            curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &response_code);
            printf("[DEBUG] Received HTTP response code: %ld\n", response_code);

            if (response_code == 204) {  // InfluxDB returns 204 for successful ping
                printf("[SUCCESS] Successfully connected to InfluxDB!\n");
                printf("[INFO] Using token: %s\n", INFLUXDB_TOKEN);
                printf("[INFO] Connection parameters verified successfully\n");
                connection_successful = true;
            } else {
                printf("[ERROR] Unexpected response code: %ld\n", response_code);
                printf("[DEBUG] Expected response code was 204\n");
            }
        }

        printf("[INFO] Cleaning up CURL resources...\n");
        curl_easy_cleanup(curl);
        printf("[DEBUG] CURL cleanup completed\n");
    } else {
        printf("[ERROR] Failed to initialize CURL\n");
    }

    return connection_successful;
}

int main() {
    printf("\n[START] InfluxDB Connection Test Program\n");
    printf("[INFO] Initializing program...\n");

    // Initialize CURL and random seed
    printf("[INFO] Performing global CURL initialization...\n");
    curl_global_init(CURL_GLOBAL_ALL);
    srand(time(NULL));
    printf("[DEBUG] CURL global init completed\n");

    // Test connection
    printf("[INFO] Starting connection test...\n");
    if (test_influxdb_connection()) {
        printf("[INFO] Connection test successful\n");
        printf("[INFO] Starting to write random numbers...\n");

        // Write 10 random numbers
        for (int i = 0; i < 100000; i++) {
            double random_value = (double)rand() / RAND_MAX * 100.0;  // Random number between 0 and 100
            if (!write_to_influxdb(random_value)) {
                printf("[ERROR] Failed to write value\n");
            }
            sleep(1);  // Sleep for 1 second between writes
        }

        printf("[INFO] Completed writing 10 random numbers\n");
        printf("[INFO] Waiting for 5 seconds...\n");
        sleep(5);  // Wait for 5 seconds
        printf("[INFO] 5-second wait completed\n");
        printf("[INFO] Initiating disconnect sequence...\n");
    } else {
        printf("[ERROR] Connection test failed\n");
        printf("[INFO] Check InfluxDB status and configuration\n");
    }

    // Cleanup
    printf("[INFO] Performing global CURL cleanup...\n");
    curl_global_cleanup();
    printf("[DEBUG] CURL global cleanup completed\n");
    printf("[END] Program execution completed\n\n");

    return 0;
}
