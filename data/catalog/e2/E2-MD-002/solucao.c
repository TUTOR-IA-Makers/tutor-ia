#include <stdio.h>

int main(void) {
    long long n, soma = 0, a = 0, b = 1;
    scanf("%lld", &n);
    while (a <= n) { soma += a; long long t = a+b; a = b; b = t; }
    printf("%lld\n", soma);
    return 0;
}
