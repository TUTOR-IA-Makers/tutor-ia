#include <stdio.h>
#include <math.h>

int main(void) {
    double x;
    scanf("%lf", &x);
    if (x > 4.0 || x < -4.0) {
        double fx = (5.0 * x + 3.0) / sqrt(x * x - 16.0);
        printf("%.4f\n", fx);
    } else {
        printf("NAO PODE SER FEITA\n");
    }
    return 0;
}
