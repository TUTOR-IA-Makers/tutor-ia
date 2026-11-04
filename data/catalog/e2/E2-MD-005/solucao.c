#include <stdio.h>

int main(void) {
    long long n;
    int passos = 0;
    scanf("%lld", &n);
    printf("%lld", n);
    while (n != 1) {
        if (n % 2 == 0) n /= 2;
        else n = 3 * n + 1;
        printf(" %lld", n);
        passos++;
    }
    printf("\n%d\n", passos);
    return 0;
}
