#include <stdio.h>

int main(void) {
    double a1, r;
    scanf("%lf %lf", &a1, &r);
    double a60 = a1 + (60 - 1) * r;
    printf("%.2f\n", a60);
    return 0;
}
