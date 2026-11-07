#include <stdio.h>
#include <math.h>

int main(void) {
    double P, i, n;
    scanf("%lf %lf %lf", &P, &i, &n);
    printf("%.2f\n", P * pow(1.0 + i / 100.0, n));
    return 0;
}
