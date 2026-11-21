#include <stdio.h>

int main(void) {
    long long a, b;
    scanf("%lld %lld", &a, &b);
    long long div3  = b/3  - (a-1)/3;
    long long div7  = b/7  - (a-1)/7;
    long long div21 = b/21 - (a-1)/21;
    printf("%lld\n", div3 + div7 - div21);
    return 0;
}
