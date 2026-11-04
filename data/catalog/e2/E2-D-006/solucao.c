#include <stdio.h>

int main(void) {
    long long bin;
    scanf("%lld", &bin);
    int dec = 0, base = 1;
    while (bin > 0) {
        int ultimo = bin % 10;
        dec = dec + ultimo * base;
        bin = bin / 10;
        base = base * 2;
    }
    printf("%d\n", dec);
    return 0;
}
