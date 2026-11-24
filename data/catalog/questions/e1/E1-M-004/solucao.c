#include <stdio.h>
#include <math.h>

int main(void) {
    double xnum1, xnum2, xnum3, x;
    scanf("%lf %lf %lf", &xnum1, &xnum2, &xnum3);
    x = xnum1 + xnum2 / (xnum3 + xnum1) + 2.0 * (xnum1 - xnum2) + log(64.0) / log(2.0);
    printf("%.2f\n", x);
    return 0;
}
