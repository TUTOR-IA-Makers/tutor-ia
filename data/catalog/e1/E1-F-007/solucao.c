#include <stdio.h>

int main(void) {
    double bruto;
    scanf("%lf", &bruto);
    double liquido = bruto * (1.0 - 0.11 - 0.075);
    printf("%.2f\n", liquido);
    return 0;
}
