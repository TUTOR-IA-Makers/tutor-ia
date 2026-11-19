#include <stdio.h>
#include <math.h>

#define G 6.67430e-11

int main(void) {
    double m1, m2, d;
    scanf("%lf %lf %lf", &m1, &m2, &d);
    double f = G * (m1 * m2) / (d * d);
    printf("%.4e\n", f);
    return 0;
}
