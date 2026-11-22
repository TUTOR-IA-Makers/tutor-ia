#include <stdio.h>
#include <math.h>

int main(void) {
    double a, b, c, diagonal;
    scanf("%lf %lf %lf", &a, &b, &c);
    diagonal = sqrt(a * a + b * b + c * c);
    printf("%.2f\n", diagonal);
    return 0;
}
