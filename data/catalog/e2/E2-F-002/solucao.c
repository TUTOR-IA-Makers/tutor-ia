#include <stdio.h>

int main(void) {
    double a, b, c;
    scanf("%lf %lf %lf", &a, &b, &c);
    if (a >= b+c || b >= a+c || c >= a+b) {
        printf("invalido\n");
    } else if (a == b && b == c) {
        printf("equilatero\n");
    } else if (a == b || b == c || a == c) {
        printf("isosceles\n");
    } else {
        printf("escaleno\n");
    }
    return 0;
}
