#include <stdio.h>

int main(void) {
    double h, peso;
    char sexo;
    scanf("%lf %c", &h, &sexo);
    if (sexo == 'M' || sexo == 'm') peso = 72.7 * h - 58.0;
    else peso = 62.1 * h - 44.7;
    printf("%.2f\n", peso);
    return 0;
}
