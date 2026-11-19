#include <stdio.h>

int main(void) {
    double saldo, credito;
    scanf("%lf", &saldo);
    if (saldo <= 500.0) credito = 0.0;
    else if (saldo <= 1000.0) credito = saldo * 0.3;
    else if (saldo <= 3000.0) credito = saldo * 0.4;
    else credito = saldo * 0.5;
    printf("%.2f\n%.2f\n", saldo, credito);
    return 0;
}
