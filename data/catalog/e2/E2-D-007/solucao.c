#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    if (n == 0) {
        printf("0\n");
        return 0;
    }
    long long bin = 0, mult = 1;
    while (n > 0) {
        int resto = n % 2;
        bin = bin + resto * mult;
        mult *= 10;
        n /= 2;
    }
    printf("%lld\n", bin);
    return 0;
}
