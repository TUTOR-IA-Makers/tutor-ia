#include <stdio.h>

int main(void) {
    double a, b, c, maior2, lados2;
    scanf("%lf %lf %lf", &a, &b, &c);
    if (a < b + c && b < a + c && c < a + b) {
        if (a >= b && a >= c) { maior2 = a * a; lados2 = b * b + c * c; }
        else if (b >= a && b >= c) { maior2 = b * b; lados2 = a * a + c * c; }
        else { maior2 = c * c; lados2 = a * a + b * b; }
        if (maior2 == lados2) printf("retangulo\n");
        else if (maior2 > lados2) printf("obtusangulo\n");
        else printf("acutangulo\n");
    } else {
        printf("nao forma triangulo\n");
    }
    return 0;
}
