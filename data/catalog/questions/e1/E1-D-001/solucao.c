#include <stdio.h>

int main(void) {
    int conta, inv, d1, d2, d3, soma, digito;
    scanf("%d", &conta);
    d1 = conta / 100;
    d2 = (conta % 100) / 10;
    d3 = conta % 10;
    inv = d3 * 100 + d2 * 10 + d1;
    soma = conta + inv;
    d1 = (soma / 100) * 1;
    d2 = ((soma % 100) / 10) * 2;
    d3 = (soma % 10) * 3;
    digito = (d1 + d2 + d3) % 10;
    printf("%d\n", digito);
    return 0;
}
