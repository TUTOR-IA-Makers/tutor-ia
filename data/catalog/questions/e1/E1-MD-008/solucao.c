#include <stdio.h>
#include <math.h>

int main(void) {
    double montante, taxa;
    double anos;
    scanf("%lf %lf %lf", &montante, &taxa, &anos);
    double p = montante / pow(1.0 + taxa / 100.0, anos);
    printf("%.2f\n", p);
    return 0;
}
