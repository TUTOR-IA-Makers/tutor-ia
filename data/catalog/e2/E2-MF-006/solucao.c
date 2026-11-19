#include <stdio.h>

int main(void) {
    double a, b, soma;
    scanf("%lf %lf", &a, &b);
    soma = a + b;
    if (soma > 20.0) {
        printf("%.2f\n", soma + 8.0);
    } else {
        printf("%.2f\n", soma - 5.0);
    }
    return 0;
}
