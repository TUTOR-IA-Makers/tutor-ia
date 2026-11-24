#include <stdio.h>

int main(void) {
    double valor, taxa, prest;
    int tempo;
    scanf("%lf %lf %d", &valor, &taxa, &tempo);
    prest = valor + (valor * (taxa / 100.0) * tempo);
    printf("%.2f\n", prest);
    return 0;
}
