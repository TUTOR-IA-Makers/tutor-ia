#include <stdio.h>
#include <math.h>

int main(void) {
    double a, b, c;
    scanf("%lf %lf %lf", &a, &b, &c);
    double delta = b*b - 4.0*a*c;
    double x1 = (-b + sqrt(delta)) / (2.0*a);
    double x2 = (-b - sqrt(delta)) / (2.0*a);
    printf("%.4f\n%.4f\n%.4f\n", delta, x1, x2);
    return 0;
}
