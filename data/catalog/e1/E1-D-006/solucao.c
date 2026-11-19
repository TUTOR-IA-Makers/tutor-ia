#include <stdio.h>
#include <math.h>

int main(void) {
    double a, t;
    scanf("%lf %lf", &a, &t);
    double s = 0.5 * a * t * t;
    double v = a * t;
    printf("%.2f\n%.2f\n", s, v);
    return 0;
}
