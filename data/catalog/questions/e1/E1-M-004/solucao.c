#include <stdio.h>

int main(void) {
    double k;
    scanf("%lf", &k);
    double c = k - 273.15;
    double f = c * 9.0 / 5.0 + 32.0;
    printf("%.2f\n%.2f\n", c, f);
    return 0;
}
