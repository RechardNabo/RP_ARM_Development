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

#define CAN_INTERFACE "can0"

void print_timestamp(void) {
    time_t now;
    struct tm *tm_info;
    char timestamp[20];
    
    time(&now);
    tm_info = localtime(&now);
    strftime(timestamp, 20, "%H:%M:%S", tm_info);
    printf("[%s] ", timestamp);
}

// Function to print data in both hex and ASCII format
void print_data_readable(const unsigned char *data, int length) {
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

int main(void) {
    int socket_fd;
    struct sockaddr_can addr;
    struct ifreq ifr;
    struct can_frame frame;
    unsigned long msg_count = 0;
    unsigned long rx_count = 0;

    print_timestamp();
    printf("Starting CAN communication application...\n");

    // Open the socket
    print_timestamp();
    printf("Creating CAN socket...\n");
    socket_fd = socket(PF_CAN, SOCK_RAW, CAN_RAW);
    if (socket_fd < 0) {
        print_timestamp();
        perror("ERROR: Socket creation failed");
        return EXIT_FAILURE;
    }
    print_timestamp();
    printf("SUCCESS: CAN socket created\n");

    // Get interface index
    print_timestamp();
    printf("Configuring CAN interface '%s'...\n", CAN_INTERFACE);
    strcpy(ifr.ifr_name, CAN_INTERFACE);
    if (ioctl(socket_fd, SIOCGIFINDEX, &ifr) < 0) {
        print_timestamp();
        perror("ERROR: Failed to get interface index");
        close(socket_fd);
        return EXIT_FAILURE;
    }
    print_timestamp();
    printf("SUCCESS: Interface index obtained for %s\n", CAN_INTERFACE);

    // Bind the socket
    print_timestamp();
    printf("Binding CAN socket...\n");
    addr.can_family = AF_CAN;
    addr.can_ifindex = ifr.ifr_ifindex;
    if (bind(socket_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        print_timestamp();
        perror("ERROR: Socket binding failed");
        close(socket_fd);
        return EXIT_FAILURE;
    }
    print_timestamp();
    printf("SUCCESS: Socket bound to %s interface\n", CAN_INTERFACE);

    // Initialize transmission frame
    print_timestamp();
    printf("Initializing CAN frame for transmission...\n");
    frame.can_id = 0x123;  // Set ID to 0x123
    frame.can_dlc = 8;     // Data length = 8 bytes
    frame.data[0] = 'R';
    frame.data[1] = 'P';
    frame.data[2] = '3';
    frame.data[3] = ' ';
    frame.data[4] = 'C';
    frame.data[5] = 'A';
    frame.data[6] = 'N';
    frame.data[7] = 0x00;  // Counter starts at 0

    print_timestamp();
    printf("CAN communication initialized successfully\n");
    print_timestamp();
    printf("Starting main communication loop...\n");
    printf("\n--- Communication Status ---\n");

    // Main loop - send and receive messages
    while (1) {
        // Send a CAN message
        if (write(socket_fd, &frame, sizeof(struct can_frame)) != sizeof(struct can_frame)) {
            print_timestamp();
            perror("ERROR: Message transmission failed");
        } else {
            msg_count++;
            print_timestamp();
            printf("TX [%03X] ", frame.can_id);
            print_data_readable(frame.data, frame.can_dlc);
            printf(" (Total TX: %lu)\n", msg_count);
        }

        frame.data[7]++;  // Increment the counter

        // Check for received messages
        struct can_frame recv_frame;
        int nbytes = read(socket_fd, &recv_frame, sizeof(struct can_frame));
        if (nbytes > 0) {
            rx_count++;
            print_timestamp();
            printf("RX [%03X] ", recv_frame.can_id);
            print_data_readable(recv_frame.data, recv_frame.can_dlc);
            printf(" (Total RX: %lu)\n", rx_count);
            
            // Add more detailed analysis for received data
            print_timestamp();
            printf("  -> DATA ANALYSIS: ID=0x%03X, DLC=%d\n", recv_frame.can_id, recv_frame.can_dlc);
            
            // Example: Interpret data based on ID (customize as needed)
            switch (recv_frame.can_id) {
                case 0x123:
                    printf("     Message type: Standard test message\n");
                    if (recv_frame.can_dlc >= 8) {
                        printf("     Counter value: %d\n", recv_frame.data[7]);
                    }
                    break;
                    
                case 0x100:
                    printf("     Message type: Sensor data\n");
                    if (recv_frame.can_dlc >= 2) {
                        int sensor_value = (recv_frame.data[0] << 8) | recv_frame.data[1];
                        printf("     Sensor value: %d\n", sensor_value);
                    }
                    break;
                    
                default:
                    printf("     Message type: Unknown (ID: 0x%03X)\n", recv_frame.can_id);
            }
        } else if (nbytes < 0) {
            print_timestamp();
            perror("ERROR: Message reception failed");
        }

        // Print statistics every 10 messages
        if (msg_count % 10 == 0) {
            print_timestamp();
            printf("\n--- Statistics Update ---\n");
            printf("Total Messages Sent: %lu\n", msg_count);
            printf("Total Messages Received: %lu\n", rx_count);
            printf("Success Rate: %.1f%%\n", (rx_count > 0 && msg_count > 0) ? ((float)rx_count / msg_count * 100) : 0);
            printf("----------------------\n\n");
        }

        sleep(1);  // Wait for 1 second
    }

    print_timestamp();
    printf("Closing CAN socket...\n");
    close(socket_fd);
    return 0;
}
