#include <stdio.h>

int main(void) {
    long long n;
    scanf("%lld", &n);
    long long inv = 0;
    while (n > 0) {
        inv = inv * 10 + n % 10;
        n /= 10;
    }
    printf("%lld\n", inv);
    return 0;
}
