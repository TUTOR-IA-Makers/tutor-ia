#include <stdio.h>
#include <math.h>

int main(void) {
    double a, b, c;
    scanf("%lf %lf %lf", &a, &b, &c);
    if (a == 0.0) {
        printf("Nao e equacao do 2 grau\n");
    } else {
        double d = b * b - 4.0 * a * c;
        if (d >= 0.0) {
            double x1 = (-b + sqrt(d)) / (2.0 * a);
            double x2 = (-b - sqrt(d)) / (2.0 * a);
            printf("%.4f\n%.4f\n", x1, x2);
        } else {
            printf("Nao ha raizes reais\n");
        }
    }
    return 0;
}
