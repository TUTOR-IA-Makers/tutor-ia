#include <stdio.h>

int main(void) {
    double a, b, c;
    scanf("%lf %lf %lf", &a, &b, &c);
    double xv = -b / (2.0 * a);
    double yv = c - b*b / (4.0*a);
    printf("%.4f\n%.4f\n", xv, yv);
    return 0;
}
