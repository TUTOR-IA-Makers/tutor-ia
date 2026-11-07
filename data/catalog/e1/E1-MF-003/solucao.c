#include <stdio.h>

int main(void) {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    printf("%.2f\n", (a + b + c) / 3.0);
    return 0;
}
