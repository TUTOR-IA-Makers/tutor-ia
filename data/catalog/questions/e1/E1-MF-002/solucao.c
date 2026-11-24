#include <stdio.h>

int main(void) {
    int dia, mes, ano;
    scanf("%d %d %d", &dia, &mes, &ano);
    printf("%02d/%02d/%04d\n", dia, mes, ano);
    return 0;
}
