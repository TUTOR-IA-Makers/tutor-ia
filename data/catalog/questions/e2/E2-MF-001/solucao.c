#include <stdio.h>

int main(void) {
    double numero;
    scanf("%lf", &numero);
    if (numero > 20.0) {
        printf("%.2f\n", numero);
    }
    return 0;
}
