#include <stdio.h>

int main(void) {
    float x;
    scanf("%f", &x);
    printf("%d\n", (int) x);
    printf("%f\n", x - ((int) x));
    return 0;
}
