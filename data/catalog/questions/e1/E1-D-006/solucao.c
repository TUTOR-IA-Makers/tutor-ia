#include <stdio.h>

int main(void) {
    double a, b, c;
    const double pi = 3.14159;
    scanf("%lf %lf %lf", &a, &b, &c);
    printf("%.3f\n", (a * c) / 2.0);
    printf("%.3f\n", pi * c * c);
    printf("%.3f\n", ((a + b) * c) / 2.0);
    printf("%.3f\n", b * b);
    printf("%.3f\n", a * b);
    return 0;
}
