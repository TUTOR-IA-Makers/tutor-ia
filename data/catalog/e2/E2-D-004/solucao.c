#include <stdio.h>

int main(void) {
    int n, is_prime = 1;
    scanf("%d", &n);
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) {
            is_prime = 0;
            break;
        }
    }
    if (is_prime) printf("primo\n");
    else printf("composto\n");
    return 0;
}
