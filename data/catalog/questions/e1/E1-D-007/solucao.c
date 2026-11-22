#include <stdio.h>

int main(void) {
    int cod1, qtd1, cod2, qtd2;
    double val1, val2, total;
    scanf("%d %d %lf", &cod1, &qtd1, &val1);
    scanf("%d %d %lf", &cod2, &qtd2, &val2);
    total = qtd1 * val1 + qtd2 * val2;
    printf("VALOR A PAGAR: R$ %.2f\n", total);
    return 0;
}
