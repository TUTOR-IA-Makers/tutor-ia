#include <stdio.h>

int main(void) {
    double a, b, c;
    scanf("%lf %lf %lf", &a, &b, &c);
    if (a < b + c && b < a + c && c < a + b) {
        if (a == b && b == c) printf("equilatero\n");
        else if (a == b || a == c || b == c) printf("isosceles\n");
        else printf("escaleno\n");
    } else {
        printf("nao forma triangulo\n");
    }
    return 0;
}
