#include <stdio.h>
#include <math.h>

int main(void) {
    int n;
    double r5, fib;
    scanf("%d", &n);
    r5 = sqrt(5.0);
    fib = (pow((1.0 + r5) / 2.0, n) - pow((1.0 - r5) / 2.0, n)) / r5;
    printf("%.1f\n", fib);
    return 0;
}
