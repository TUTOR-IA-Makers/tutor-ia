#include <stdio.h>

int main(void) {
    long long int a, b, soma;
    scanf("%lld %lld", &a, &b);
    soma = (a + b) * (b - a + 1) / 2;
    printf("%lld\n", soma);
    return 0;
}
