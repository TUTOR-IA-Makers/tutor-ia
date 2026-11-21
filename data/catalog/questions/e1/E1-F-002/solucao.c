#include <stdio.h>

int main(void) {
    double n1, n2, n3, n4;
    scanf("%lf %lf %lf %lf", &n1, &n2, &n3, &n4);
    printf("%.2f\n", (2*n1 + 3*n2 + 4*n3 + 1*n4) / 10.0);
    return 0;
}
