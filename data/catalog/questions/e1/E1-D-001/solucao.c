#include <stdio.h>
#include <math.h>

#define PI 3.14159265358979323846

int main(void) {
    int n;
    double l;
    scanf("%d %lf", &n, &l);
    double area = (n * l * l / 4.0) * (cos(PI/n) / sin(PI/n));
    printf("%.4f\n", area);
    return 0;
}
