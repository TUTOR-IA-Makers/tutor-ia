#include <stdio.h>

int main(void) {
    int band, desc;
    double kms, valor, corrida, min = 3.5;
    scanf("%d %lf %d", &band, &kms, &desc);
    if (band == 1) valor = 1.8;
    else valor = 2.3;
    corrida = valor * kms;
    if (desc == 1) corrida *= 0.7;
    if (corrida < min) corrida = min;
    printf("%.2f\n", corrida);
    return 0;
}
