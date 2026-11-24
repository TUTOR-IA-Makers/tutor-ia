#include <stdio.h>

int main(void) {
    double deposito;
    scanf("%lf", &deposito);
    printf("%.2f\n", deposito * 1.005);
    return 0;
}
