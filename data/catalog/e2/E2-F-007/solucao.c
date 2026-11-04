#include <stdio.h>

int main(void) {
    long long n;
    scanf("%lld", &n);
    if (n == 0) { printf("1\n"); return 0; }
    if (n < 0) n = -n;
    int count = 0;
    while (n > 0) { n /= 10; count++; }
    printf("%d\n", count);
    return 0;
}
