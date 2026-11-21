#include <stdio.h>

#define PI 3.14159265

int main(void) {
    double r;
    scanf("%lf", &r);
    printf("%.4f\n", PI * r * r);
    printf("%.4f\n", 2.0 * PI * r);
    return 0;
}
