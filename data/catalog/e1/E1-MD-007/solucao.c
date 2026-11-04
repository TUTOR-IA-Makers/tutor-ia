#include <stdio.h>
#include <math.h>

#define PI 3.14159265

int main(void) {
    double graus;
    scanf("%lf", &graus);
    double rad = graus * PI / 180.0;
    double val = sin(rad) * sin(rad) + cos(rad) * cos(rad);
    printf("%.6f\n", val);
    return 0;
}
