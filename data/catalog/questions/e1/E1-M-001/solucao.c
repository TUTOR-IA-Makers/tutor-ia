#include <stdio.h>

int main(void) {
    long int n_segundos;
    scanf("%ld", &n_segundos);
    printf("%d\n", (int) (n_segundos / 3600));
    printf("%d\n", (int) ((n_segundos % 3600) / 60));
    printf("%d\n", (int) (n_segundos % 60));
    return 0;
}
