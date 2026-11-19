#include <stdio.h>

int main(void) {
    double valor, taxa;
    int dias;
    scanf("%lf %lf %d", &valor, &taxa, &dias);
    double atual = valor * (1.0 - (taxa / 100.0) * dias);
    printf("%.2f\n", atual);
    return 0;
}
