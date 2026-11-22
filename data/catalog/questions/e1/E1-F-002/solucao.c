#include <stdio.h>

int main(void) {
    int ano, mes, dia;
    scanf("%d-%d-%d", &ano, &mes, &dia);
    printf("%02d/%02d/%04d\n", dia, mes, ano);
    return 0;
}
